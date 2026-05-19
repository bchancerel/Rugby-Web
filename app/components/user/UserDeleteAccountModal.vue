<script setup lang="ts">
defineProps<{
    open: boolean
    pending: boolean
    errorMessage: string
}>()

const emit = defineEmits<{
    close: []
    confirm: []
}>()
</script>

<template>
    <Teleport to="body">
        <div v-if="open" class="user-modal-backdrop" role="presentation" @click.self="emit('close')">
            <section
                class="user-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="delete-account-title"
            >
                <h2 id="delete-account-title">Supprimer le compte ?</h2>
                <p>
                    Vous etes sur le point de supprimer votre compte RugbyJam. Cette action est definitive.
                </p>

                <p v-if="errorMessage" class="user-alert">
                    {{ errorMessage }}
                </p>

                <div class="user-modal-actions">
                    <button
                        type="button"
                        class="user-secondary-button"
                        :disabled="pending"
                        @click="emit('close')"
                    >
                        Annuler
                    </button>

                    <button
                        type="button"
                        class="user-danger-button"
                        :disabled="pending"
                        @click="emit('confirm')"
                    >
                        {{ pending ? 'Suppression...' : 'Oui, supprimer' }}
                    </button>
                </div>
            </section>
        </div>
    </Teleport>
</template>
