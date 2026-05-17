<script setup lang="ts">
type CompetitionView = 'pools' | 'bracket'

defineProps<{
    modelValue: CompetitionView
}>()

const emit = defineEmits<{
    'update:modelValue': [view: CompetitionView]
}>()
</script>

<template>
    <div
        class="competition-mode-switch"
        role="tablist"
        aria-label="Vue de la competition"
    >
        <button
            type="button"
            class="competition-mode-button"
            :class="{ active: modelValue === 'pools' }"
            role="tab"
            :aria-selected="modelValue === 'pools'"
            @click="emit('update:modelValue', 'pools')"
        >
            Poules
        </button>
        <button
            type="button"
            class="competition-mode-button"
            :class="{ active: modelValue === 'bracket' }"
            role="tab"
            :aria-selected="modelValue === 'bracket'"
            @click="emit('update:modelValue', 'bracket')"
        >
            Phase finale
        </button>
    </div>
</template>
