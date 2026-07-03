<script setup lang="ts">
    definePageMeta({
        middleware: 'guest',
    })

    const { forgotPassword, pending } = useAuth()

    const email = ref('')
    const errorMessage = ref('')
    const successMessage = ref('')

    const submit = async () => {
        errorMessage.value = ''
        successMessage.value = ''

        try {
            const data = await forgotPassword({
                email: email.value,
            })

            successMessage.value = data.message
            email.value = ''
        } catch (error) {
            errorMessage.value = error instanceof Error ? error.message : 'Une erreur est survenue.'
        }
    }

    useHead({
        title: 'RugbyJam | Mot de passe oublié',
    })
</script>

<template>
    <main class="auth-page">
        <section class="auth-panel" aria-labelledby="forgot-password-title">
            <div class="brand">
                <img src="/images/logo_app.svg" alt="RugbyJam" class="brand-logo">
                <div>
                    <p class="eyebrow">RugbyJam</p>
                    <h1 id="forgot-password-title">Mot de passe oublié</h1>
                </div>
            </div>

            <p class="auth-support-text">
                Entre ton email et on t'envoie un lien pour reinitialiser ton mot de passe.
            </p>

            <form class="auth-form" @submit.prevent="submit">
                <label class="field">
                    <span>Email</span>
                    <input
                        v-model.trim="email"
                        type="email"
                        name="email"
                        autocomplété="email"
                        placeholder="toi@exemple.com"
                        required
                    >
                </label>

                <p v-if="successMessage" class="form-success" role="status">{{ successMessage }}</p>
                <p v-if="errorMessage" class="form-error" role="alert">{{ errorMessage }}</p>

                <button type="submit" class="submit-button" :disabled="pending">
                    {{ pending ? 'Envoi...' : 'Envoyer le lien' }}
                </button>

                <NuxtLink to="/auth/login" class="secondary-auth-link">
                    Retour à la connexion
                </NuxtLink>
            </form>
        </section>
    </main>
</template>
