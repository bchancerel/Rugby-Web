<script setup lang="ts">
type UserSession = {
    id: string
    userAgent: string | null
    ip: string | null
    createdAt: string
    expiresAt: string
}

const { setUser } = useAuth()
const sessions = ref<UserSession[]>([])
const sessionsPending = ref(false)
const sessionsErrorMessage = ref('')
const sessionActionId = ref<string | null>(null)

const formatDateTime = (value: string) => {
    return new Intl.DateTimeFormat('fr-FR', {
        dateStyle: 'medium',
        timeStyle: 'short',
    }).format(new Date(value))
}

const getSessionName = (session: UserSession) => {
    return session.userAgent || 'Session inconnue'
}

const fetchSessions = async () => {
    sessionsPending.value = true
    sessionsErrorMessage.value = ''

    try {
        sessions.value = await $fetch<UserSession[]>('/api/users/sessions', {
            credentials: 'include',
        })
    } catch (error) {
        sessionsErrorMessage.value = error instanceof Error ? error.message : 'Impossible de charger les sessions.'
    } finally {
        sessionsPending.value = false
    }
}

const revokeSession = async (sessionId: string) => {
    sessionActionId.value = sessionId
    sessionsErrorMessage.value = ''

    try {
        await $fetch(`/api/users/sessions/${sessionId}`, {
            method: 'DELETE',
            credentials: 'include',
        })

        sessions.value = sessions.value.filter((session) => session.id !== sessionId)
    } catch (error) {
        sessionsErrorMessage.value = error instanceof Error ? error.message : 'Impossible de supprimer cette session.'
    } finally {
        sessionActionId.value = null
    }
}

const revokeAllSessions = async () => {
    sessionsPending.value = true
    sessionsErrorMessage.value = ''

    try {
        await $fetch('/api/users/sessions', {
            method: 'DELETE',
            credentials: 'include',
        })

        setUser(null)
        setTimeout(() => {
            void navigateTo('/')
        }, 0)
    } catch (error) {
        sessionsErrorMessage.value = error instanceof Error ? error.message : 'Impossible de supprimer les sessions.'
        sessionsPending.value = false
    }
}

onMounted(() => {
    void fetchSessions()
})
</script>

<template>
    <section class="user-panel" aria-labelledby="sessions-title">
        <div class="user-panel-heading">
            <div>
                <h2 id="sessions-title">Sessions actives</h2>
                <p>Appareils connectes a ton compte.</p>
            </div>

            <button
                type="button"
                class="user-secondary-button"
                :disabled="sessionsPending"
                @click="fetchSessions"
            >
                {{ sessionsPending ? 'Chargement...' : 'Actualiser' }}
            </button>
        </div>

        <p v-if="sessionsErrorMessage" class="user-alert">
            {{ sessionsErrorMessage }}
        </p>

        <div v-if="sessionsPending && !sessions.length" class="user-empty">
            Chargement des sessions...
        </div>

        <div v-else-if="!sessions.length" class="user-empty">
            Aucune session active trouvee.
        </div>

        <div v-else class="user-session-list">
            <article v-for="session in sessions" :key="session.id" class="user-session-item">
                <div>
                    <h3>{{ getSessionName(session) }}</h3>
                    <p>
                        IP {{ session.ip || 'inconnue' }} - Creee le {{ formatDateTime(session.createdAt) }} - Expire le {{ formatDateTime(session.expiresAt) }}
                    </p>
                </div>

                <button
                    type="button"
                    class="user-danger-button"
                    :disabled="sessionsPending || sessionActionId === session.id"
                    @click="revokeSession(session.id)"
                >
                    {{ sessionActionId === session.id ? 'Suppression...' : 'Supprimer' }}
                </button>
            </article>
        </div>

        <button
            type="button"
            class="user-danger-button user-danger-button-wide"
            :disabled="sessionsPending || !sessions.length"
            @click="revokeAllSessions"
        >
            Supprimer toutes les sessions
        </button>
    </section>
</template>
