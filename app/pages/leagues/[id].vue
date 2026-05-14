<script setup lang="ts">
import '~/assets/css/components/leagues.css'
import type { RugbyLeague } from '~/types/rugby'
import {
    RUGBY_PLACEHOLDER_LOGO,
    setRugbyPlaceholderLogo,
} from '~/composables/useRugbyLeagues'

definePageMeta({
    middleware: 'auth',
})

const route = useRoute()
const leagueId = computed(() => String(route.params.id))

const { data: leagues, error, pending, refresh } = await useApiFetch<RugbyLeague[]>('/rugby/leagues', {
    default: () => [],
})

const league = computed(() =>
    leagues.value.find((item) => item.id !== null && String(item.id) === leagueId.value) ?? null
)

const refreshLeague = () => {
    void refresh()
}

useHead(() => ({
    title: league.value?.name ? `RugbyJam | ${league.value.name}` : 'RugbyJam | Competition',
}))

onMounted(() => {
    refreshLeague()
})
</script>

<template>
    <main class="league-detail-page">
        <section class="detail-panel">
            <NuxtLink to="/leagues" class="detail-back-link">
                <span aria-hidden="true">&lt;-</span>
                Retour aux competitions
            </NuxtLink>

            <p v-if="pending" class="state">
                Chargement de la competition...
            </p>

            <div v-else-if="error" class="state error">
                <p>
                    Impossible de recuperer cette competition.
                    <span>{{ error.message }}</span>
                </p>
                <button type="button" @click="refreshLeague">
                    Reessayer
                </button>
            </div>

            <div v-else-if="league" class="league-detail">
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
                        {{ [league.type, league.seasons.length ? `${league.seasons.length} saisons` : null].filter(Boolean).join(' / ') }}
                    </p>
                </div>
            </div>

            <div v-else class="state">
                Competition introuvable.
            </div>
        </section>
    </main>
</template>
