<script setup lang="ts">
import type { AuthUser } from '~/types/auth'

const props = defineProps<{
    user: AuthUser | null
}>()

const emailStatus = computed(() => {
    return props.user?.emailVerified ? 'Email verifie' : 'Email non verifie'
})

const formatDate = (value?: string) => {
    if (!value) {
        return 'Non disponible'
    }

    return new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'long',
    }).format(new Date(value))
}
</script>

<template>
    <section class="user-panel" aria-labelledby="user-info-title">
        <h2 id="user-info-title">Mes infos</h2>

        <dl class="user-info-list">
            <div>
                <dt>Pseudo</dt>
                <dd>{{ user?.username || 'Non renseigne' }}</dd>
            </div>

            <div>
                <dt>Email</dt>
                <dd>{{ user?.email }}</dd>
            </div>

            <div>
                <dt>Statut</dt>
                <dd>{{ emailStatus }}</dd>
            </div>

            <div>
                <dt>Role</dt>
                <dd>{{ user?.role }}</dd>
            </div>

            <div>
                <dt>Creation</dt>
                <dd>{{ formatDate(user?.createdAt) }}</dd>
            </div>
        </dl>
    </section>
</template>
