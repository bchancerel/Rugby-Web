<script setup lang="ts">
const { toasts, dismissToast } = useSupporterRewards()

const getBadgeInitials = (label: string) =>
    label
        .split(' ')
        .filter(Boolean)
        .slice(0, 2)
        .map((word) => word[0]?.toUpperCase())
        .join('')
</script>

<template>
    <Teleport to="body">
        <div v-if="toasts.length" class="supporter-toast-stack" aria-live="polite">
            <article
                v-for="toast in toasts"
                :key="toast.id"
                class="supporter-badge-toast"
            >
                <button
                    class="supporter-badge-toast-close"
                    type="button"
                    aria-label="Fermer la notification"
                    @click="dismissToast(toast.id)"
                >
                    ×
                </button>
                <span class="supporter-badge-toast-mark" aria-hidden="true">
                    {{ getBadgeInitials(toast.badge.label) }}
                </span>
                <div>
                    <p>Badge debloque</p>
                    <h2>{{ toast.badge.label }}</h2>
                    <span>+{{ toast.badge.xp }} XP bonus</span>
                </div>
            </article>
        </div>
    </Teleport>
</template>
