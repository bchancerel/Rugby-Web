<script setup lang="ts">
import MatchLiveIndicator from '~/components/match/MatchLiveIndicator.vue'
import type { RugbyFixture, RugbyMatchesHome } from '~/types/rugby'
import {
    RUGBY_PLACEHOLDER_LOGO,
    setRugbyPlaceholderLogo,
} from '~/composables/useRugbyLeagues'

definePageMeta({
    middleware: 'auth',
})

const apiFetch = useApiRequest()
const { getFixtureMatchPath, getFixtureTeamPath } = useRugbyTeamLinks()

const liveFixtures = ref<RugbyFixture[]>([])
const liveFixturesPending = ref(false)
const liveFixturesError = ref('')
const upcomingFixtures = ref<RugbyFixture[]>([])
const upcomingFixturesPending = ref(false)
const upcomingFixturesError = ref('')
let matchesRefreshTimer: ReturnType<typeof setInterval> | null = null

const MATCHES_REFRESH_INTERVAL_MS = 15_000

const getApiErrorMessage = (error: unknown) => {
    const apiError = error as { data?: { message?: string }, message?: string }
    return apiError.data?.message || apiError.message || 'Matchs indisponibles.'
}

const fetchMatchesHome = async ({ showPending = true } = {}) => {
    if (showPending) {
        liveFixturesPending.value = true
        upcomingFixturesPending.value = true
        liveFixturesError.value = ''
        upcomingFixturesError.value = ''
    }

    try {
        const data = await apiFetch<RugbyMatchesHome>('/rugby/matches/home', {
            cache: 'no-store',
            query: { t: String(Date.now()) },
        })

        liveFixtures.value = data.liveFixtures
        upcomingFixtures.value = data.upcomingFixtures
        liveFixturesError.value = ''
        upcomingFixturesError.value = ''
    } catch (error) {
        if (showPending || (liveFixtures.value.length === 0 && upcomingFixtures.value.length === 0)) {
            liveFixtures.value = []
            upcomingFixtures.value = []
            liveFixturesError.value = getApiErrorMessage(error)
            upcomingFixturesError.value = getApiErrorMessage(error)
        }
    } finally {
        if (showPending) {
            liveFixturesPending.value = false
            upcomingFixturesPending.value = false
        }
    }
}

const startMatchesRefresh = () => {
    if (!import.meta.client || matchesRefreshTimer) return

    matchesRefreshTimer = setInterval(() => {
        void fetchMatchesHome({ showPending: false })
    }, MATCHES_REFRESH_INTERVAL_MS)
}

const stopMatchesRefresh = () => {
    if (!matchesRefreshTimer) return

    clearInterval(matchesRefreshTimer)
    matchesRefreshTimer = null
}

const liveCount = computed(() =>
    liveFixtures.value.length
)

const formatFixtureScore = (fixture: RugbyFixture) => {
    if (fixture.score.home === null || fixture.score.away === null) return 'vs'
    return `${fixture.score.home} - ${fixture.score.away}`
}

const formatFixtureKickoff = (date: string | null) => {
    if (!date) return 'Date a venir'

    const kickoff = new Date(date)
    if (Number.isNaN(kickoff.getTime())) return 'Date a venir'

    return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).format(kickoff)
}

onMounted(() => {
    void fetchMatchesHome()
    startMatchesRefresh()
})

onBeforeUnmount(() => {
    stopMatchesRefresh()
})

useHead({
    title: 'RugbyJam | Matchs',
})
</script>

<template>
    <main class="match-page">
        <section class="match-page-shell" aria-labelledby="match-page-title">
            <header class="match-page-header">
                <div>
                    <p class="match-page-eyebrow">Calendrier</p>
                    <h1 id="match-page-title">Matchs</h1>
                    <p>Les affiches a suivre selon tes favoris et les coups d'envoi proches.</p>
                </div>
            </header>

            <section class="match-page-section match-live-section" aria-labelledby="live-matches-title">
                <div class="match-page-section-heading">
                    <div>
                        <p class="match-page-eyebrow live">Live</p>
                        <h2 id="live-matches-title">Matchs en live</h2>
                    </div>
                    <span>{{ liveCount }} match{{ liveCount > 1 ? 's' : '' }}</span>
                </div>

                <div v-if="liveFixturesPending" class="match-page-state">
                    Chargement des matchs en live...
                </div>

                <div v-else-if="liveFixturesError" class="match-page-state error">
                    {{ liveFixturesError }}
                </div>

                <div v-else-if="liveFixtures.length === 0" class="match-page-state">
                    Aucun match en live actuellement.
                </div>

                <div v-else class="match-list match-live-list">
                    <article
                        v-for="fixture in liveFixtures"
                        :key="fixture.id ?? `${fixture.date}-${fixture.teams.home.name}-${fixture.teams.away.name}`"
                        class="match-card match-live-card"
                    >
                        <p class="match-kickoff">
                            <MatchLiveIndicator :fixture="fixture" />
                            {{ fixture.league.name ?? 'Competition' }} / {{ fixture.status.long ?? fixture.status.short ?? 'En cours' }}
                        </p>

                        <div class="match-row">
                            <div class="match-team home">
                                <NuxtLink
                                    v-if="getFixtureTeamPath(fixture, fixture.teams.home.id)"
                                    :to="getFixtureTeamPath(fixture, fixture.teams.home.id)"
                                    class="match-team-link"
                                >
                                    <img
                                        :src="fixture.teams.home.logo || RUGBY_PLACEHOLDER_LOGO"
                                        :alt="fixture.teams.home.name ?? 'Equipe domicile'"
                                        class="match-team-logo"
                                        @error="setRugbyPlaceholderLogo"
                                    >
                                    <span>{{ fixture.teams.home.name ?? 'Equipe domicile' }}</span>
                                </NuxtLink>
                                <template v-else>
                                    <img
                                        :src="fixture.teams.home.logo || RUGBY_PLACEHOLDER_LOGO"
                                        :alt="fixture.teams.home.name ?? 'Equipe domicile'"
                                        class="match-team-logo"
                                        @error="setRugbyPlaceholderLogo"
                                    >
                                    <span>{{ fixture.teams.home.name ?? 'Equipe domicile' }}</span>
                                </template>
                            </div>

                            <NuxtLink
                                v-if="getFixtureMatchPath(fixture)"
                                :to="getFixtureMatchPath(fixture)"
                                class="match-score match-score-link live"
                            >
                                {{ formatFixtureScore(fixture) }}
                            </NuxtLink>
                            <strong v-else class="match-score live">
                                {{ formatFixtureScore(fixture) }}
                            </strong>

                            <div class="match-team away">
                                <NuxtLink
                                    v-if="getFixtureTeamPath(fixture, fixture.teams.away.id)"
                                    :to="getFixtureTeamPath(fixture, fixture.teams.away.id)"
                                    class="match-team-link"
                                >
                                    <span>{{ fixture.teams.away.name ?? 'Equipe exterieure' }}</span>
                                    <img
                                        :src="fixture.teams.away.logo || RUGBY_PLACEHOLDER_LOGO"
                                        :alt="fixture.teams.away.name ?? 'Equipe exterieure'"
                                        class="match-team-logo"
                                        @error="setRugbyPlaceholderLogo"
                                    >
                                </NuxtLink>
                                <template v-else>
                                    <span>{{ fixture.teams.away.name ?? 'Equipe exterieure' }}</span>
                                    <img
                                        :src="fixture.teams.away.logo || RUGBY_PLACEHOLDER_LOGO"
                                        :alt="fixture.teams.away.name ?? 'Equipe exterieure'"
                                        class="match-team-logo"
                                        @error="setRugbyPlaceholderLogo"
                                    >
                                </template>
                            </div>
                        </div>
                    </article>
                </div>
            </section>

            <section class="match-page-section" aria-labelledby="upcoming-matches-title">
                <div class="match-page-section-heading">
                    <div>
                        <p class="match-page-eyebrow">36h</p>
                        <h2 id="upcoming-matches-title">Prochains matchs</h2>
                    </div>
                    <span>{{ upcomingFixtures.length }} match{{ upcomingFixtures.length > 1 ? 's' : '' }}</span>
                </div>

                <div v-if="upcomingFixturesPending" class="match-page-state">
                    Chargement des prochains matchs...
                </div>

                <div v-else-if="upcomingFixturesError" class="match-page-state error">
                    {{ upcomingFixturesError }}
                </div>

                <div v-else-if="upcomingFixtures.length === 0" class="match-page-state">
                    Aucun coup d'envoi dans les 36 prochaines heures.
                </div>

                <div v-else class="match-list">
                    <article
                        v-for="fixture in upcomingFixtures"
                        :key="fixture.id ?? `${fixture.date}-${fixture.teams.home.name}-${fixture.teams.away.name}`"
                        class="match-card"
                    >
                        <p class="match-kickoff">
                            <MatchLiveIndicator :fixture="fixture" />
                            {{ fixture.league.name ?? 'Competition' }} / {{ formatFixtureKickoff(fixture.date) }}
                        </p>

                        <div class="match-row">
                            <div class="match-team home">
                                <NuxtLink
                                    v-if="getFixtureTeamPath(fixture, fixture.teams.home.id)"
                                    :to="getFixtureTeamPath(fixture, fixture.teams.home.id)"
                                    class="match-team-link"
                                >
                                    <img
                                        :src="fixture.teams.home.logo || RUGBY_PLACEHOLDER_LOGO"
                                        :alt="fixture.teams.home.name ?? 'Equipe domicile'"
                                        class="match-team-logo"
                                        @error="setRugbyPlaceholderLogo"
                                    >
                                    <span>{{ fixture.teams.home.name ?? 'Equipe domicile' }}</span>
                                </NuxtLink>
                                <template v-else>
                                    <img
                                        :src="fixture.teams.home.logo || RUGBY_PLACEHOLDER_LOGO"
                                        :alt="fixture.teams.home.name ?? 'Equipe domicile'"
                                        class="match-team-logo"
                                        @error="setRugbyPlaceholderLogo"
                                    >
                                    <span>{{ fixture.teams.home.name ?? 'Equipe domicile' }}</span>
                                </template>
                            </div>

                            <NuxtLink
                                v-if="getFixtureMatchPath(fixture)"
                                :to="getFixtureMatchPath(fixture)"
                                class="match-score match-score-link"
                            >
                                {{ formatFixtureScore(fixture) }}
                            </NuxtLink>
                            <strong v-else class="match-score">
                                {{ formatFixtureScore(fixture) }}
                            </strong>

                            <div class="match-team away">
                                <NuxtLink
                                    v-if="getFixtureTeamPath(fixture, fixture.teams.away.id)"
                                    :to="getFixtureTeamPath(fixture, fixture.teams.away.id)"
                                    class="match-team-link"
                                >
                                    <span>{{ fixture.teams.away.name ?? 'Equipe exterieure' }}</span>
                                    <img
                                        :src="fixture.teams.away.logo || RUGBY_PLACEHOLDER_LOGO"
                                        :alt="fixture.teams.away.name ?? 'Equipe exterieure'"
                                        class="match-team-logo"
                                        @error="setRugbyPlaceholderLogo"
                                    >
                                </NuxtLink>
                                <template v-else>
                                    <span>{{ fixture.teams.away.name ?? 'Equipe exterieure' }}</span>
                                    <img
                                        :src="fixture.teams.away.logo || RUGBY_PLACEHOLDER_LOGO"
                                        :alt="fixture.teams.away.name ?? 'Equipe exterieure'"
                                        class="match-team-logo"
                                        @error="setRugbyPlaceholderLogo"
                                    >
                                </template>
                            </div>
                        </div>
                    </article>
                </div>
            </section>
        </section>
    </main>
</template>
