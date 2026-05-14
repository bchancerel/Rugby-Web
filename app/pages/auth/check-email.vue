<script setup lang="ts">
    import '~/assets/css/components/login.css'

    const { user, pending, isAuthenticated, resendVerification } = useAuth()

    const errorMessage = ref('')
    const successMessage = ref('')

    const primaryLink = computed(() => {
        if (!isAuthenticated.value) {
            return '/auth/login'
        }

        return user.value?.emailVerified ? '/rugby/leagues' : '/auth/login'
    })

    const primaryLabel = computed(() => {
        if (!isAuthenticated.value) {
            return 'Retour a la connexion'
        }

        return user.value?.emailVerified ? 'Aller aux ligues' : 'Se reconnecter plus tard'
    })

    const canResendVerification = computed(() => {
        return isAuthenticated.value && !user.value?.emailVerified
    })

    const submit = async () => {
        errorMessage.value = ''
        successMessage.value = ''

        try {
            const data = await resendVerification()
            successMessage.value = data.message
        } catch (error) {
            errorMessage.value = error instanceof Error ? error.message : 'Une erreur est survenue.'
        }
    }

    useHead({
        title: 'RugbyJam | Validation email',
    })
</script>

<template>
    <main class="auth-page">
        <section class="auth-panel" aria-labelledby="check-email-title">
            <div class="brand">
                <img src="/images/logo_app.svg" alt="RugbyJam" class="brand-logo">
                <div>
                    <p class="eyebrow">RugbyJam</p>
                    <h1 id="check-email-title">Verifie tes mails</h1>
                </div>
            </div>

            <p class="auth-support-text">
                Ton compte est cree. On t'a envoye un lien de validation par email pour activer ton acces.
            </p>

            <div class="auth-form">
                <p class="form-success" role="status">
                    Ouvre ta boite mail, clique sur le lien RugbyJam, puis reviens te connecter.
                </p>

                <p v-if="successMessage" class="form-success" role="status">{{ successMessage }}</p>
                <p v-if="errorMessage" class="form-error" role="alert">{{ errorMessage }}</p>

                <button
                    v-if="canResendVerification"
                    type="button"
                    class="submit-button"
                    :disabled="pending"
                    @click="submit"
                >
                    {{ pending ? 'Envoi...' : 'Renvoyer le lien' }}
                </button>

                <NuxtLink :to="primaryLink" class="secondary-auth-link">
                    {{ primaryLabel }}
                </NuxtLink>
            </div>
        </section>
    </main>
</template>
