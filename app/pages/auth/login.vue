<script setup lang="ts">
    definePageMeta({
        middleware: 'guest',
    })

    const { login, register, pending, isAuthenticated } = useAuth()

    const mode = ref<'login' | 'register'>('login')
    const email = ref('')
    const password = ref('')
    const username = ref('')
    const errorMessage = ref('')

    const isRegister = computed(() => mode.value === 'register')
    const title = computed(() => (isRegister.value ? 'Créer un compte' : 'Connexion'))
    const submitLabel = computed(() => {
        if (pending.value) return isRegister.value ? 'Creation...' : 'Connexion...'

        return isRegister.value ? 'Créer mon compte' : 'Se connecter'
    })

    watch(mode, () => {
        errorMessage.value = ''
    })

    watch(isAuthenticated, async (authenticated) => {
        if (authenticated && !isRegister.value) {
            await navigateTo('/dashboard')
        }
    }, { immediate: true })

    const submit = async () => {
        errorMessage.value = ''

        try {
            if (isRegister.value) {
                await register({
                    email: email.value,
                    password: password.value,
                    username: username.value || undefined,
                })

                await navigateTo('/auth/check-email')
                return
            } else {
                await login({
                    email: email.value,
                    password: password.value,
                })
            }

            await navigateTo('/dashboard')
        } catch (error) {
            errorMessage.value = error instanceof Error ? error.message : 'Une erreur est survenue.'
        }
    }

    useHead({
        title: `RugbyJam | Login`,
    })
</script>

<template>
    <main class="auth-page">
        <section class="auth-panel" aria-labelledby="auth-title">
            <div class="brand">
                <img src="/images/logo_app.svg" alt="RugbyJam" class="brand-logo">
                <div>
                    <p class="eyebrow">RugbyJam</p>
                    <h1 id="auth-title">{{ title }}</h1>
                </div>
            </div>

            <div class="mode-switch" role="tablist" aria-label="Choix du formulaire">
                <button
                    type="button"
                    class="mode-button"
                    :class="{ active: mode === 'login' }"
                    role="tab"
                    :aria-selected="mode === 'login'"
                    @click="mode = 'login'"
                >
                    Connexion
                </button>
                <button
                    type="button"
                    class="mode-button"
                    :class="{ active: mode === 'register' }"
                    role="tab"
                    :aria-selected="mode === 'register'"
                    @click="mode = 'register'"
                >
                    Inscription
                </button>
            </div>

            <form class="auth-form" @submit.prevent="submit">
                <Transition name="form-field">
                    <label v-if="isRegister" class="field">
                        <span>Nom d'utilisateur</span>
                        <input
                            v-model.trim="username"
                            type="text"
                            name="username"
                            autocomplété="username"
                            minlength="2"
                            maxlength="30"
                            placeholder="ton pseudo"
                        >
                    </label>
                </Transition>

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

                <label class="field">
                    <span>Mot de passe</span>
                    <input
                        v-model="password"
                        type="password"
                        name="password"
                        :autocomplété="isRegister ? 'new-password' : 'current-password'"
                        placeholder="Minimum 8 caracteres"
                        minlength="8"
                        required
                    >
                </label>

                <p v-if="isRegister" class="user-password-rules">
                    Minimum 8 caracteres, avec au moins une majuscule, un chiffre et un caractere special.
                </p>

                <NuxtLink v-if="!isRegister" to="/auth/forgot-password" class="forgot-password-link">
                    Mot de passe oublié ?
                </NuxtLink>

                <p v-if="errorMessage" class="form-error" role="alert">{{ errorMessage }}</p>

                <button type="submit" class="submit-button" :disabled="pending">
                    {{ submitLabel }}
                </button>
            </form>
        </section>
    </main>
</template>
