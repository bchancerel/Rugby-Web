<script setup lang="ts">
    import '~/assets/css/components/login.css'

    definePageMeta({
        middleware: 'guest',
    })

    const route = useRoute()
    const { resetPassword, pending } = useAuth()

    const password = ref('')
    const passwordConfirmation = ref('')
    const errorMessage = ref('')
    const successMessage = ref('')

    const token = computed(() => {
        return typeof route.query.token === 'string' ? route.query.token : ''
    })

    const submit = async () => {
        errorMessage.value = ''
        successMessage.value = ''

        if (!token.value) {
            errorMessage.value = 'Le lien de reinitialisation est invalide.'
            return
        }

        if (password.value !== passwordConfirmation.value) {
            errorMessage.value = 'Les mots de passe ne correspondent pas.'
            return
        }

        try {
            const data = await resetPassword({
                token: token.value,
                password: password.value,
            })

            successMessage.value = data.message
            password.value = ''
            passwordConfirmation.value = ''
        } catch (error) {
            errorMessage.value = error instanceof Error ? error.message : 'Une erreur est survenue.'
        }
    }

    useHead({
        title: 'RugbyJam | Nouveau mot de passe',
    })
</script>

<template>
    <main class="auth-page">
        <section class="auth-panel" aria-labelledby="reset-password-title">
            <div class="brand">
                <img src="/images/logo_app.svg" alt="RugbyJam" class="brand-logo">
                <div>
                    <p class="eyebrow">RugbyJam</p>
                    <h1 id="reset-password-title">Nouveau mot de passe</h1>
                </div>
            </div>

            <p class="auth-support-text">
                Choisis un nouveau mot de passe pour recuperer l'acces a ton compte.
            </p>

            <form class="auth-form" @submit.prevent="submit">
                <label class="field">
                    <span>Nouveau mot de passe</span>
                    <input
                        v-model="password"
                        type="password"
                        name="password"
                        autocomplete="new-password"
                        placeholder="Minimum 8 caracteres"
                        minlength="8"
                        required
                    >
                </label>

                <label class="field">
                    <span>Confirmer le mot de passe</span>
                    <input
                        v-model="passwordConfirmation"
                        type="password"
                        name="passwordConfirmation"
                        autocomplete="new-password"
                        placeholder="Repete ton mot de passe"
                        minlength="8"
                        required
                    >
                </label>

                <p v-if="successMessage" class="form-success" role="status">{{ successMessage }}</p>
                <p v-if="errorMessage" class="form-error" role="alert">{{ errorMessage }}</p>

                <button type="submit" class="submit-button" :disabled="pending || !token">
                    {{ pending ? 'Enregistrement...' : 'Changer le mot de passe' }}
                </button>

                <NuxtLink to="/login" class="secondary-auth-link">
                    Retour a la connexion
                </NuxtLink>
            </form>
        </section>
    </main>
</template>
