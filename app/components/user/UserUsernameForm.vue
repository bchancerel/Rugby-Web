<script setup lang="ts">
import type { AuthUser } from '~/types/auth'

const props = defineProps<{
    user: AuthUser | null
    pending: boolean
}>()

const { updateMe } = useAuth()
const username = ref(props.user?.username || '')
const successMessage = ref('')
const errorMessage = ref('')

watch(
    () => props.user,
    (nextUser) => {
        username.value = nextUser?.username || ''
    }
)

const submitUsername = async () => {
    successMessage.value = ''
    errorMessage.value = ''

    const nextUsername = username.value.trim()

    if (!nextUsername) {
        errorMessage.value = 'Choisis un pseudo avant de sauvegarder.'
        return
    }

    if (nextUsername === props.user?.username) {
        successMessage.value = 'Ton pseudo est deja a jour.'
        return
    }

    try {
        await updateMe({ username: nextUsername })
        successMessage.value = 'Pseudo mis a jour.'
    } catch (error) {
        errorMessage.value = error instanceof Error ? error.message : 'Impossible de modifier le pseudo.'
    }
}
</script>

<template>
    <section class="user-panel" aria-labelledby="username-title">
        <h2 id="username-title">Modifier mon pseudo</h2>

        <form class="user-form" @submit.prevent="submitUsername">
            <label for="username">Pseudo</label>
            <input
                id="username"
                v-model.trim="username"
                type="text"
                name="username"
                autocomplete="username"
                minlength="2"
                maxlength="30"
                placeholder="ton pseudo"
                :disabled="pending"
            >

            <p v-if="successMessage" class="user-success">
                {{ successMessage }}
            </p>

            <p v-if="errorMessage" class="user-alert">
                {{ errorMessage }}
            </p>

            <button type="submit" class="user-button" :disabled="pending">
                {{ pending ? 'Sauvegarde...' : 'Sauvegarder' }}
            </button>
        </form>
    </section>
</template>
