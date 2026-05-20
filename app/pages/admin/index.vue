<script setup lang="ts">
    import type { AdminUser } from '~/types/admin'
    import type { AuthRole } from '~/types/auth'

    definePageMeta({
        middleware: 'admin',
    })

    useHead({
        title: 'RugbyJam | Admin',
    })

    const roleOptions: AuthRole[] = ['USER', 'ADMIN']
    const { user: currentUser } = useAuth()
    const {
        users,
        page,
        total,
        totalPages,
        pending,
        actionPendingUserId,
        errorMessage,
        fetchUsers,
        updateUserRole,
        deleteUser,
    } = useAdminUsers()

    const hasPreviousPage = computed(() => page.value > 1)
    const hasNextPage = computed(() => page.value < totalPages.value)

    const formatDate = (value: string) => {
        return new Intl.DateTimeFormat('fr-FR', {
            dateStyle: 'medium',
        }).format(new Date(value))
    }

    const getUserName = (adminUser: AdminUser) => {
        return adminUser.username || adminUser.email
    }

    const isCurrentUser = (adminUser: AdminUser) => {
        return adminUser.id === currentUser.value?.id
    }

    const hasCurrentUserInPage = computed(() => {
        return users.value.some((adminUser) => isCurrentUser(adminUser))
    })

    const isUserActionPending = (adminUser: AdminUser) => {
        return actionPendingUserId.value === adminUser.id
    }

    const isUserProtected = (adminUser: AdminUser) => {
        return isCurrentUser(adminUser)
    }

    const handleRoleChange = async (adminUser: AdminUser, event: Event) => {
        const target = event.target as HTMLSelectElement
        const role = target.value as AuthRole

        if (role === adminUser.role) {
            return
        }

        if (isUserProtected(adminUser)) {
            target.value = adminUser.role
            return
        }

        const updatedUser = await updateUserRole(adminUser.id, role)

        if (!updatedUser) {
            target.value = adminUser.role
        }
    }

    const handleDelete = async (adminUser: AdminUser) => {
        if (isUserProtected(adminUser)) {
            return
        }

        const confirmed = window.confirm(`Supprimer le compte ${getUserName(adminUser)} ?`)

        if (!confirmed) {
            return
        }

        await deleteUser(adminUser.id)
    }

    const goToPage = async (nextPage: number) => {
        if (nextPage < 1 || nextPage > totalPages.value || pending.value) {
            return
        }

        await fetchUsers(nextPage)
    }

    onMounted(() => {
        void fetchUsers()
    })
</script>

<template>
    <main class="admin-page">
        <section class="admin-shell" aria-labelledby="admin-title">
            <div class="admin-heading">
                <p class="admin-eyebrow">Administration</p>
                <h1 id="admin-title">Gestion des utilisateurs</h1>
                <p>
                    Liste des comptes RugbyJam, avec gestion des roles et suppression des utilisateurs.
                </p>
            </div>

            <div class="admin-panel">
                <div class="admin-toolbar">
                    <div>
                        <p class="admin-count">{{ total }} utilisateur{{ total > 1 ? 's' : '' }}</p>
                        <p class="admin-muted">Page {{ page }} / {{ totalPages }}</p>
                    </div>

                    <button type="button" class="admin-button" :disabled="pending" @click="fetchUsers(page)">
                        {{ pending ? 'Chargement...' : 'Actualiser' }}
                    </button>
                </div>

                <p v-if="errorMessage" class="admin-alert">
                    {{ errorMessage }}
                </p>

                <p v-if="hasCurrentUserInPage" class="admin-info">
                    Votre propre compte est protege : vous ne pouvez pas vous supprimer ni retirer votre role admin ici.
                </p>

                <div v-if="pending && !users.length" class="admin-empty">
                    Chargement des utilisateurs...
                </div>

                <div v-else-if="!users.length" class="admin-empty">
                    Aucun utilisateur trouve.
                </div>

                <div v-else class="admin-table-wrapper">
                    <table class="admin-table">
                        <thead>
                            <tr>
                                <th scope="col">Utilisateur</th>
                                <th scope="col">Email</th>
                                <th scope="col">Role</th>
                                <th scope="col">Creation</th>
                                <th scope="col" class="admin-actions-heading">Actions</th>
                            </tr>
                        </thead>

                        <tbody>
                            <tr v-for="adminUser in users" :key="adminUser.id">
                                <td>
                                    <div class="admin-user-cell">
                                        <span class="admin-avatar">{{ getUserName(adminUser).charAt(0).toUpperCase() }}</span>
                                        <div>
                                            <strong>{{ getUserName(adminUser) }}</strong>
                                            <span v-if="isCurrentUser(adminUser)" class="admin-current-user">Vous</span>
                                        </div>
                                    </div>
                                </td>

                                <td>{{ adminUser.email }}</td>

                                <td>
                                    <select
                                        class="admin-select"
                                        :value="adminUser.role"
                                        :disabled="isUserProtected(adminUser) || isUserActionPending(adminUser)"
                                        :title="isUserProtected(adminUser) ? 'Votre role admin est protege' : 'Modifier le role'"
                                        @change="handleRoleChange(adminUser, $event)"
                                    >
                                        <option v-for="role in roleOptions" :key="role" :value="role">
                                            {{ role }}
                                        </option>
                                    </select>
                                </td>

                                <td>{{ formatDate(adminUser.createdAt) }}</td>

                                <td class="admin-actions">
                                    <button
                                        type="button"
                                        class="admin-danger-button"
                                        :disabled="isUserProtected(adminUser) || isUserActionPending(adminUser)"
                                        :title="isUserProtected(adminUser) ? 'Vous ne pouvez pas supprimer votre propre compte' : 'Supprimer ce compte'"
                                        @click="handleDelete(adminUser)"
                                    >
                                        {{ isUserActionPending(adminUser) ? 'Traitement...' : 'Supprimer' }}
                                    </button>

                                    <span v-if="isUserProtected(adminUser)" class="admin-action-note">
                                        Compte protege
                                    </span>
                                </td>
                            </tr>
                        </tbody>
                    </table>
                </div>

                <div class="admin-pagination" aria-label="Pagination des utilisateurs">
                    <button
                        type="button"
                        class="admin-secondary-button"
                        :disabled="!hasPreviousPage || pending"
                        @click="goToPage(page - 1)"
                    >
                        Precedent
                    </button>

                    <span>Page {{ page }} sur {{ totalPages }}</span>

                    <button
                        type="button"
                        class="admin-secondary-button"
                        :disabled="!hasNextPage || pending"
                        @click="goToPage(page + 1)"
                    >
                        Suivant
                    </button>
                </div>
            </div>
        </section>
    </main>
</template>
