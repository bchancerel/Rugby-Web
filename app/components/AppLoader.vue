<script setup lang="ts">
withDefaults(defineProps<{
    label?: string
    compact?: boolean
}>(), {
    label: 'Chargement...',
    compact: false,
})
</script>

<template>
    <div class="app-loader" :class="{ compact }" role="status" aria-live="polite">
        <span class="app-loader-spinner" aria-hidden="true" />
        <span class="app-loader-label">{{ label }}</span>
    </div>
</template>
