<script setup lang="ts">
import SupporterBadgeGrid from '~/components/supporter/SupporterBadgeGrid.vue'
import SupporterLevelGauge from '~/components/supporter/SupporterLevelGauge.vue'
import SupporterRecentEvents from '~/components/supporter/SupporterRecentEvents.vue'
import type { SupporterProfile } from '~/types/supporter'

const props = defineProps<{
    profile: SupporterProfile
}>()

const lockedBadges = computed(() =>
    props.profile.badges.filter((badge) => !badge.unlocked)
)

const nextGoals = computed(() => lockedBadges.value.slice(0, 3))
</script>

<template>
    <div class="supporter-dashboard">
        <SupporterLevelGauge
            :level="profile.level"
            :total-xp="profile.totalXp"
        />

        <SupporterBadgeGrid :badges="profile.badges" />

        <SupporterRecentEvents :events="profile.recentEvents" />
    </div>
</template>
