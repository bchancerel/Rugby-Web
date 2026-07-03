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
                :class="{ 'level-up': toast.type === 'level' }"
            >
                <button
                    class="supporter-badge-toast-close"
                    type="button"
                    aria-label="Fermer la notification"
                    @click="dismissToast(toast.id)"
                >
                    x
                </button>
                <span
                    v-if="toast.type === 'badge'"
                    class="supporter-badge-toast-mark"
                    aria-hidden="true"
                >
                    <img :src="getSupporterBadgeImageSrc(toast.badge.key)" alt="" loading="lazy">
                </span>
                <span v-else class="supporter-badge-toast-mark" aria-hidden="true">
                    {{ toast.level.value }}
                </span>
                <div>
                    <template v-if="toast.type === 'badge'">
                        <p>Badge débloqué</p>
                        <h2>{{ toast.badge.label }}</h2>
                        <span>+{{ toast.badge.xp }} XP bonus</span>
                    </template>
                    <template v-else>
                        <p>Niveau atteint</p>
                        <h2>{{ toast.level.label }}</h2>
                        <span>Niveau {{ toast.level.value }}</span>
                    </template>
                </div>
            </article>
        </div>
    </Teleport>
</template>
