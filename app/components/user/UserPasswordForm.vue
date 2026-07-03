<script setup lang="ts">
const props = defineProps<{
    pending: boolean
}>()

const { updateMe } = useAuth()
const currentPassword = ref('')
const newPassword = ref('')
const confirmPassword = ref('')
const showCurrentPassword = ref(false)
const showNewPassword = ref(false)
const showConfirmPassword = ref(false)
const passwordSuccessMessage = ref('')
const passwordErrorMessage = ref('')

const submitPassword = async () => {
    passwordSuccessMessage.value = ''
    passwordErrorMessage.value = ''

    if (!currentPassword.value || !newPassword.value || !confirmPassword.value) {
        passwordErrorMessage.value = 'Remplis les trois champs pour changer ton mot de passe.'
        return
    }

    if (newPassword.value !== confirmPassword.value) {
        passwordErrorMessage.value = 'Les deux nouveaux mots de passe ne correspondent pas.'
        return
    }

    try {
        await updateMe({
            currentPassword: currentPassword.value,
            password: newPassword.value,
        })

        currentPassword.value = ''
        newPassword.value = ''
        confirmPassword.value = ''
        passwordSuccessMessage.value = 'Mot de passe mis à jour.'
    } catch (error) {
        passwordErrorMessage.value = error instanceof Error ? error.message : 'Impossible de modifier le mot de passe.'
    }
}
</script>

<template>
    <section class="user-panel" aria-labelledby="password-title">
        <h2 id="password-title">Modifier mon mot de passe</h2>

        <form class="user-form" @submit.prevent="submitPassword">
            <label for="current-password">Ancien mot de passe</label>
            <div class="user-password-field">
                <input
                    id="current-password"
                    v-model="currentPassword"
                    :type="showCurrentPassword ? 'text' : 'password'"
                    name="current-password"
                    autocomplété="current-password"
                    :disabled="props.pending"
                >
                <button
                    type="button"
                    class="user-password-toggle"
                    :disabled="props.pending"
                    :aria-label="showCurrentPassword ? 'Masquer le mot de passe actuel' : 'Afficher le mot de passe actuel'"
                    @click="showCurrentPassword = !showCurrentPassword"
                >
                    {{ showCurrentPassword ? 'Masquer' : 'Voir' }}
                </button>
            </div>

            <label for="new-password">Nouveau mot de passe</label>
            <div class="user-password-field">
                <input
                    id="new-password"
                    v-model="newPassword"
                    :type="showNewPassword ? 'text' : 'password'"
                    name="new-password"
                    autocomplété="new-password"
                    minlength="8"
                    :disabled="props.pending"
                >
                <button
                    type="button"
                    class="user-password-toggle"
                    :disabled="props.pending"
                    :aria-label="showNewPassword ? 'Masquer le nouveau mot de passe' : 'Afficher le nouveau mot de passe'"
                    @click="showNewPassword = !showNewPassword"
                >
                    {{ showNewPassword ? 'Masquer' : 'Voir' }}
                </button>
            </div>

            <label for="confirm-password">Confirmer le nouveau mot de passe</label>
            <div class="user-password-field">
                <input
                    id="confirm-password"
                    v-model="confirmPassword"
                    :type="showConfirmPassword ? 'text' : 'password'"
                    name="confirm-password"
                    autocomplété="new-password"
                    minlength="8"
                    :disabled="props.pending"
                >
                <button
                    type="button"
                    class="user-password-toggle"
                    :disabled="props.pending"
                    :aria-label="showConfirmPassword ? 'Masquer la confirmation du mot de passe' : 'Afficher la confirmation du mot de passe'"
                    @click="showConfirmPassword = !showConfirmPassword"
                >
                    {{ showConfirmPassword ? 'Masquer' : 'Voir' }}
                </button>
            </div>

            <p v-if="passwordSuccessMessage" class="user-success">
                {{ passwordSuccessMessage }}
            </p>

            <p v-if="passwordErrorMessage" class="user-alert">
                {{ passwordErrorMessage }}
            </p>

            <p class="user-password-rules">
                Minimum 8 caracteres, avec au moins une majuscule, un chiffre et un caractere special.
            </p>

            <button type="submit" class="user-button" :disabled="props.pending">
                {{ props.pending ? 'Sauvegarde...' : 'Changer le mot de passe' }}
            </button>
        </form>
    </section>
</template>
