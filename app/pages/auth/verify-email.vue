<script setup lang="ts">
    import '~/assets/css/components/login.css'

    const route = useRoute()
    const { verifyEmail, fetchMe, pending, isAuthenticated } = useAuth()

    const errorMessage = ref('')
    const successMessage = ref('')
    const hasTriedVerification = ref(false)

    const token = computed(() => {
        return typeof route.query.token === 'string' ? route.query.token : ''
    })

    const primaryLink = computed(() => {
        return isAuthenticated.value ? '/leagues' : '/auth/login'
    })

    const primaryLabel = computed(() => {
        return isAuthenticated.value ? 'Retour aux ligues' : 'Retour a la connexion'
    })

    const submit = async () => {
        errorMessage.value = ''
        successMessage.value = ''
        hasTriedVerification.value = true

        if (!token.value) {
            errorMessage.value = 'Le lien de verification est invalide.'
            return
        }

        try {
            const data = await verifyEmail({
                token: token.value,
            })

            successMessage.value = data.message

            if (isAuthenticated.value) {
                await fetchMe()
            }
        } catch (error) {
            errorMessage.value = error instanceof Error ? error.message : 'Une erreur est survenue.'
        }
    }

    onMounted(() => {
        submit()
    })

    useHead({
        title: 'RugbyJam | Verification email',
    })
</script>

<template>
    <main class="auth-page">
        <section class="auth-panel" aria-labelledby="verify-email-title">
            <div class="brand">
                <img src="/images/logo_app.svg" alt="RugbyJam" class="brand-logo">
                <div>
                    <p class="eyebrow">RugbyJam</p>
                    <h1 id="verify-email-title">Verification email</h1>
                </div>
            </div>

            <p class="auth-support-text">
                On verifie ton adresse email pour finaliser la securite de ton compte.
            </p>

            <div class="auth-form">
                <p v-if="pending && !successMessage" class="auth-support-text">
                    Verification en cours...
                </p>

                <p v-if="successMessage" class="form-success" role="status">{{ successMessage }}</p>
                <p v-if="errorMessage" class="form-error" role="alert">{{ errorMessage }}</p>

                <button
                    v-if="errorMessage && token"
                    type="button"
                    class="submit-button"
                    :disabled="pending"
                    @click="submit"
                >
                    {{ pending ? 'Verification...' : 'Reessayer' }}
                </button>

                <NuxtLink
                    v-if="successMessage || errorMessage || hasTriedVerification"
                    :to="primaryLink"
                    class="secondary-auth-link"
                >
                    {{ primaryLabel }}
                </NuxtLink>
            </div>
        </section>
    </main>
</template>
