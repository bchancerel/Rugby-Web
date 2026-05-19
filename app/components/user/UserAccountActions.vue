<script setup lang="ts">
import UserDeleteAccountModal from './UserDeleteAccountModal.vue'

const props = defineProps<{
    pending: boolean
}>()

const { logout, setUser } = useAuth()
const deleteAccountModalOpen = ref(false)
const deleteAccountPending = ref(false)
const deleteAccountErrorMessage = ref('')

const submitLogout = async () => {
    await logout()
    await navigateTo('/')
}

const openDeleteAccountModal = () => {
    deleteAccountErrorMessage.value = ''
    deleteAccountModalOpen.value = true
}

const closeDeleteAccountModal = () => {
    if (deleteAccountPending.value) {
        return
    }

    deleteAccountModalOpen.value = false
}

const deleteAccount = async () => {
    deleteAccountPending.value = true
    deleteAccountErrorMessage.value = ''

    try {
        await $fetch('/api/users/me', {
            method: 'DELETE',
            credentials: 'include',
        })

        setUser(null)
        await navigateTo('/')
    } catch (error) {
        deleteAccountErrorMessage.value = error instanceof Error ? error.message : 'Impossible de supprimer le compte.'
    } finally {
        deleteAccountPending.value = false
    }
}
</script>

<template>
    <button type="button" class="user-logout-button" :disabled="props.pending" @click="submitLogout">
        Se deconnecter
    </button>

    <button
        type="button"
        class="user-delete-account-button"
        :disabled="props.pending"
        @click="openDeleteAccountModal"
    >
        Supprimer mon compte
    </button>

    <UserDeleteAccountModal
        :open="deleteAccountModalOpen"
        :pending="deleteAccountPending"
        :error-message="deleteAccountErrorMessage"
        @close="closeDeleteAccountModal"
        @confirm="deleteAccount"
    />
</template>
