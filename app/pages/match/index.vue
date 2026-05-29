<script setup lang="ts">
import MatchLiveIndicator from '~/components/match/MatchLiveIndicator.vue'
import type { RugbyFavoriteMatch, RugbyFixture, RugbyMatchesHome } from '~/types/rugby'
import {
    RUGBY_PLACEHOLDER_LOGO,
    setRugbyPlaceholderLogo,
} from '~/composables/useRugbyLeagues'

definePageMeta({
    middleware: 'auth',
})

const apiFetch = useApiRequest()
const { getFixtureMatchPath, getFixtureTeamPath } = useRugbyTeamLinks()

const favoriteMatches = ref<RugbyFavoriteMatch[]>([])
const favoriteMatchesPending = ref(false)
const favoriteMatchesError = ref('')
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
        favoriteMatchesPending.value = true
        liveFixturesPending.value = true
        upcomingFixturesPending.value = true
        favoriteMatchesError.value = ''
        liveFixturesError.value = ''
        upcomingFixturesError.value = ''
    }

    try {
        const data = await apiFetch<RugbyMatchesHome>('/rugby/matches/home', {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache',
                Pragma: 'no-cache',
            },
        })

        favoriteMatches.value = data.favoriteMatches
        liveFixtures.value = data.liveFixtures
        upcomingFixtures.value = data.upcomingFixtures
        favoriteMatchesError.value = ''
        liveFixturesError.value = ''
        upcomingFixturesError.value = ''
    } catch (error) {
        if (showPending || (favoriteMatches.value.length === 0 && liveFixtures.value.length === 0 && upcomingFixtures.value.length === 0)) {
            favoriteMatches.value = []
            liveFixtures.value = []
            upcomingFixtures.value = []
            favoriteMatchesError.value = getApiErrorMessage(error)
            liveFixturesError.value = getApiErrorMessage(error)
            upcomingFixturesError.value = getApiErrorMessage(error)
        }
    } finally {
        if (showPending) {
            favoriteMatchesPending.value = false
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

const hasFavoriteMatches = computed(() =>
    favoriteMatches.value.length > 0
)

const favoriteCount = computed(() =>
    favoriteMatches.value.length
)

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

            <section class="match-page-section" aria-labelledby="favorite-matches-title">
                <div class="match-page-section-heading">
                    <div>
                        <p class="match-page-eyebrow">Priorite</p>
                        <h2 id="favorite-matches-title">Favoris</h2>
                    </div>
                    <span>{{ favoriteCount }} favori{{ favoriteCount > 1 ? 's' : '' }}</span>
                </div>

                <div v-if="favoriteMatchesPending" class="match-page-state">
                    Chargement des matchs favoris...
                </div>

                <div v-if="favoriteMatchesError" class="match-page-state error">
                    {{ favoriteMatchesError }}
                </div>

                <div v-if="!favoriteMatchesPending && !favoriteMatchesError && favoriteCount === 0" class="match-page-state">
                    Aucun favori pour le moment.
                </div>

                <div v-else-if="!favoriteMatchesPending && !favoriteMatchesError && !hasFavoriteMatches" class="match-page-state">
                    Aucun championnat favori pour le moment.
                </div>

                <div v-else-if="!favoriteMatchesPending && hasFavoriteMatches" class="match-favorite-grid">
                    <article
                        v-for="item in favoriteMatches"
                        :key="item.key"
                        class="match-favorite-card"
                    >
                        <header class="match-favorite-card-header">
                            <img
                                :src="item.logo || RUGBY_PLACEHOLDER_LOGO"
                                :alt="item.label"
                                class="match-favorite-league-logo"
                                @error="setRugbyPlaceholderLogo"
                            >
                            <div>
                                <span>Championnat</span>
                                <h3>{{ item.label }}</h3>
                            </div>
                        </header>

                        <div class="match-favorite-block">
                            <small>Dernier match</small>
                            <p v-if="item.lastFixture" class="match-favorite-row">
                                <span class="match-favorite-team home">
                                    <NuxtLink
                                        v-if="getFixtureTeamPath(item.lastFixture, item.lastFixture.teams.home.id)"
                                        :to="getFixtureTeamPath(item.lastFixture, item.lastFixture.teams.home.id)"
                                        class="match-team-link"
                                    >
                                        <img
                                            :src="item.lastFixture.teams.home.logo || RUGBY_PLACEHOLDER_LOGO"
                                            :alt="item.lastFixture.teams.home.name ?? 'Domicile'"
                                            class="match-favorite-team-logo"
                                            @error="setRugbyPlaceholderLogo"
                                        >
                                        <span>{{ item.lastFixture.teams.home.name ?? 'Domicile' }}</span>
                                    </NuxtLink>
                                    <template v-else>
                                        <img
                                            :src="item.lastFixture.teams.home.logo || RUGBY_PLACEHOLDER_LOGO"
                                            :alt="item.lastFixture.teams.home.name ?? 'Domicile'"
                                            class="match-favorite-team-logo"
                                            @error="setRugbyPlaceholderLogo"
                                        >
                                        <span>{{ item.lastFixture.teams.home.name ?? 'Domicile' }}</span>
                                    </template>
                                </span>
                                <NuxtLink
                                    v-if="getFixtureMatchPath(item.lastFixture)"
                                    :to="getFixtureMatchPath(item.lastFixture)"
                                    class="match-score-link"
                                >
                                    {{ formatFixtureScore(item.lastFixture) }}
                                </NuxtLink>
                                <strong v-else>{{ formatFixtureScore(item.lastFixture) }}</strong>
                                <span class="match-favorite-team away">
                                    <NuxtLink
                                        v-if="getFixtureTeamPath(item.lastFixture, item.lastFixture.teams.away.id)"
                                        :to="getFixtureTeamPath(item.lastFixture, item.lastFixture.teams.away.id)"
                                        class="match-team-link away"
                                    >
                                        <span>{{ item.lastFixture.teams.away.name ?? 'Exterieur' }}</span>
                                        <img
                                            :src="item.lastFixture.teams.away.logo || RUGBY_PLACEHOLDER_LOGO"
                                            :alt="item.lastFixture.teams.away.name ?? 'Exterieur'"
                                            class="match-favorite-team-logo"
                                            @error="setRugbyPlaceholderLogo"
                                        >
                                    </NuxtLink>
                                    <template v-else>
                                        <span>{{ item.lastFixture.teams.away.name ?? 'Exterieur' }}</span>
                                        <img
                                            :src="item.lastFixture.teams.away.logo || RUGBY_PLACEHOLDER_LOGO"
                                            :alt="item.lastFixture.teams.away.name ?? 'Exterieur'"
                                            class="match-favorite-team-logo"
                                            @error="setRugbyPlaceholderLogo"
                                        >
                                    </template>
                                </span>
                            </p>
                            <em v-else>Indisponible</em>
                            <time v-if="item.lastFixture">
                                <MatchLiveIndicator :fixture="item.lastFixture" />
                                {{ formatFixtureKickoff(item.lastFixture.date) }}
                            </time>
                        </div>

                        <div class="match-favorite-block">
                            <small>Prochain match</small>
                            <p v-if="item.nextFixture" class="match-favorite-row">
                                <span class="match-favorite-team home">
                                    <NuxtLink
                                        v-if="getFixtureTeamPath(item.nextFixture, item.nextFixture.teams.home.id)"
                                        :to="getFixtureTeamPath(item.nextFixture, item.nextFixture.teams.home.id)"
                                        class="match-team-link"
                                    >
                                        <img
                                            :src="item.nextFixture.teams.home.logo || RUGBY_PLACEHOLDER_LOGO"
                                            :alt="item.nextFixture.teams.home.name ?? 'Domicile'"
                                            class="match-favorite-team-logo"
                                            @error="setRugbyPlaceholderLogo"
                                        >
                                        <span>{{ item.nextFixture.teams.home.name ?? 'Domicile' }}</span>
                                    </NuxtLink>
                                    <template v-else>
                                        <img
                                            :src="item.nextFixture.teams.home.logo || RUGBY_PLACEHOLDER_LOGO"
                                            :alt="item.nextFixture.teams.home.name ?? 'Domicile'"
                                            class="match-favorite-team-logo"
                                            @error="setRugbyPlaceholderLogo"
                                        >
                                        <span>{{ item.nextFixture.teams.home.name ?? 'Domicile' }}</span>
                                    </template>
                                </span>
                                <NuxtLink
                                    v-if="getFixtureMatchPath(item.nextFixture)"
                                    :to="getFixtureMatchPath(item.nextFixture)"
                                    class="match-score-link"
                                >
                                    {{ formatFixtureScore(item.nextFixture) }}
                                </NuxtLink>
                                <strong v-else>{{ formatFixtureScore(item.nextFixture) }}</strong>
                                <span class="match-favorite-team away">
                                    <NuxtLink
                                        v-if="getFixtureTeamPath(item.nextFixture, item.nextFixture.teams.away.id)"
                                        :to="getFixtureTeamPath(item.nextFixture, item.nextFixture.teams.away.id)"
                                        class="match-team-link away"
                                    >
                                        <span>{{ item.nextFixture.teams.away.name ?? 'Exterieur' }}</span>
                                        <img
                                            :src="item.nextFixture.teams.away.logo || RUGBY_PLACEHOLDER_LOGO"
                                            :alt="item.nextFixture.teams.away.name ?? 'Exterieur'"
                                            class="match-favorite-team-logo"
                                            @error="setRugbyPlaceholderLogo"
                                        >
                                    </NuxtLink>
                                    <template v-else>
                                        <span>{{ item.nextFixture.teams.away.name ?? 'Exterieur' }}</span>
                                        <img
                                            :src="item.nextFixture.teams.away.logo || RUGBY_PLACEHOLDER_LOGO"
                                            :alt="item.nextFixture.teams.away.name ?? 'Exterieur'"
                                            class="match-favorite-team-logo"
                                            @error="setRugbyPlaceholderLogo"
                                        >
                                    </template>
                                </span>
                            </p>
                            <em v-else>Indisponible</em>
                            <time v-if="item.nextFixture">
                                <MatchLiveIndicator :fixture="item.nextFixture" />
                                {{ formatFixtureKickoff(item.nextFixture.date) }}
                            </time>
                        </div>
                    </article>
                </div>
            </section>

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
