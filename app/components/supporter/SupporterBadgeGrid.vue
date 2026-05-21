<script setup lang="ts">
import type { SupporterBadge } from '~/types/supporter'
import { getSupporterBadgeImageSrc } from '~/utils/supporterBadges'

const props = defineProps<{
    badges: SupporterBadge[]
}>()

const { isBadgeRecentlyUnlocked, clearRecentBadge } = useSupporterRewards()

const unlockedCount = computed(() => props.badges.filter((badge) => badge.unlocked).length)

const handleBadgeAnimationEnd = (badge: SupporterBadge) => {
    if (badge.unlocked && isBadgeRecentlyUnlocked(badge.key)) {
        clearRecentBadge(badge.key)
    }
}
</script>

<template>
    <section class="supporter-panel" aria-labelledby="supporter-badges-title">
        <div class="supporter-panel-heading">
            <div>
                <p class="supporter-eyebrow">Badges</p>
                <h2 id="supporter-badges-title">Collection</h2>
            </div>
            <strong>{{ unlockedCount }}/{{ badges.length }}</strong>
        </div>

        <div class="supporter-badge-grid">
            <article
                v-for="badge in badges"
                :key="badge.key"
                class="supporter-badge"
                :class="{
                    locked: !badge.unlocked,
                    'recently-unlocked': badge.unlocked && isBadgeRecentlyUnlocked(badge.key),
                }"
                @animationend="handleBadgeAnimationEnd(badge)"
            >
                <span class="supporter-badge-mark" aria-hidden="true">
                    <img :src="getSupporterBadgeImageSrc(badge.key)" alt="" loading="lazy">
                </span>
                <div>
                    <h3>{{ badge.label }}</h3>
                    <p>{{ badge.description }}</p>
                    <small>{{ badge.xp }} XP bonus</small>
                </div>
            </article>
        </div>
    </section>
</template>
