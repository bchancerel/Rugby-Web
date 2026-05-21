<script setup lang="ts">
import { getSupporterBadgeImageSrc } from '~/utils/supporterBadges'

const { toasts, dismissToast } = useSupporterRewards()
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
                    <img :src="getSupporterBadgeImageSrc(toast.badge.key)" alt="">
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
