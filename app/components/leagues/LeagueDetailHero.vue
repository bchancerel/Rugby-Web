<script setup lang="ts">
import type { RugbyLeague } from '~/types/rugby'
import {
    RUGBY_PLACEHOLDER_LOGO,
    setRugbyPlaceholderLogo,
} from '~/composables/useRugbyLeagues'

defineProps<{
    league: RugbyLeague
    competitionMeta: string
}>()
</script>

<template>
    <div class="league-detail">
        <div class="detail-logo-frame">
            <img
                :src="league.logo || RUGBY_PLACEHOLDER_LOGO"
                :alt="league.name ?? 'Competition'"
                class="detail-league-logo"
                @error="setRugbyPlaceholderLogo"
            >
        </div>

        <div class="detail-copy">
            <p class="eyebrow">{{ league.country.name ?? 'Competition' }}</p>
            <h1>{{ league.name }}</h1>
            <p class="detail-meta">
                {{ competitionMeta }}
            </p>
        </div>
    </div>
</template>
