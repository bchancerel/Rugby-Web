<script setup lang="ts">
import type { RugbyFixture, RugbyMatchOdds } from '~/types/rugby'
import {
    RUGBY_PLACEHOLDER_LOGO,
    setRugbyPlaceholderLogo,
} from '~/composables/useRugbyLeagues'

definePageMeta({
    middleware: 'auth',
})

const route = useRoute()
const apiFetch = useApiRequest()
const { getFixtureTeamPath } = useRugbyTeamLinks()
const { trackEntityView } = useSupporterTracking()

const fixture = ref<RugbyFixture | null>(null)
const odds = ref<RugbyMatchOdds | null>(null)
const pending = ref(false)
const oddsPending = ref(false)
const errorMessage = ref('')
const oddsErrorMessage = ref('')
const liveLastUpdatedAt = ref<Date | null>(null)
const scoringSides = ref<Array<'home' | 'away'>>([])
let liveRefreshTimer: ReturnType<typeof setInterval> | null = null
let scoreCelebrationTimer: ReturnType<typeof setTimeout> | null = null
let liveRefreshInFlight = false

const LIVE_REFRESH_INTERVAL_MS = 15_000
const FINAL_STATUS_CODES = new Set(['FT', 'AET', 'CANC', 'PST', 'POST', 'ABD', 'AWD', 'WO'])
const NOT_STARTED_STATUS_CODES = new Set(['NS', 'TBD'])
const LIVE_STATUS_CODES = new Set(['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT', 'INTR'])
const LIVE_STATUS_LABELS = [
    'live',
    'in play',
    'in progress',
    'first half',
    'half time',
    'halftime',
    'second half',
    'extra time',
    'break time',
    'interrupted',
    'pause',
]

const matchId = computed(() => String(route.params.id ?? ''))
const hasScore = computed(() =>
    fixture.value?.score.home !== null && fixture.value?.score.away !== null
)
const statusLabel = computed(() =>
    fixture.value?.status.long ?? fixture.value?.status.short ?? (hasScore.value ? 'Terminé' : 'A venir')
)
const isFixtureFinal = computed(() => {
    const shortStatus = fixture.value?.status.short?.toUpperCase()
    const longStatus = fixture.value?.status.long?.toLowerCase()

    return Boolean(
        shortStatus && FINAL_STATUS_CODES.has(shortStatus)
        || longStatus?.includes('finished')
        || longStatus?.includes('cancelled')
        || longStatus?.includes('postponed')
        || longStatus?.includes('abandoned')
    )
})
const isFixtureLive = computed(() => {
    const shortStatus = fixture.value?.status.short?.toUpperCase()
    const longStatus = fixture.value?.status.long?.toLowerCase()

    if (!fixture.value || isFixtureFinal.value) return false
    if (shortStatus && NOT_STARTED_STATUS_CODES.has(shortStatus)) return false
    if (shortStatus && LIVE_STATUS_CODES.has(shortStatus)) return true
    if (LIVE_STATUS_LABELS.some((label) => longStatus?.includes(label))) return true

    return fixture.value.status.elapsed !== null
})
const shouldShowFixtureOdds = computed(() => {
    if (!fixture.value || isFixtureFinal.value) return false

    const shortStatus = fixture.value.status.short?.toUpperCase()
    return isFixtureLive.value || Boolean(shortStatus && NOT_STARTED_STATUS_CODES.has(shortStatus))
})
const shouldProbeLiveFixture = computed(() => {
    if (!fixture.value || isFixtureFinal.value) return false

    const kickoffTime = fixture.value.timestamp !== null
        ? fixture.value.timestamp * 1000
        : fixture.value.date
            ? new Date(fixture.value.date).getTime()
            : Number.NaN

    if (Number.isNaN(kickoffTime)) return true

    const now = Date.now()
    const probeStartsAt = kickoffTime - 30 * 60 * 1000
    const probeEndsAt = kickoffTime + 4 * 60 * 60 * 1000

    return now >= probeStartsAt && now <= probeEndsAt
})
const shouldAutoRefreshFixture = computed(() => isFixtureLive.value || shouldProbeLiveFixture.value)
const liveLastUpdatedLabel = computed(() => {
    if (!liveLastUpdatedAt.value) return null

    return new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
    }).format(liveLastUpdatedAt.value)
})
const matchTitle = computed(() => {
    const home = fixture.value?.teams.home.name ?? 'Domicile'
    const away = fixture.value?.teams.away.name ?? 'Exterieur'

    return `${home} - ${away}`
})

const getApiErrorMessage = (error: unknown) => {
    const apiError = error as { data?: { message?: string }, message?: string }
    return apiError.data?.message || apiError.message || 'Match indisponible.'
}

const formatFixtureKickoff = (date: string | null) => {
    if (!date) return 'Date a venir'

    const kickoff = new Date(date)
    if (Number.isNaN(kickoff.getTime())) return 'Date a venir'

    return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
    }).format(kickoff)
}

const formatFixtureDate = (date: string | null) => {
    if (!date) return 'Date a venir'

    const kickoff = new Date(date)
    if (Number.isNaN(kickoff.getTime())) return 'Date a venir'

    return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: '2-digit',
        month: 'long',
        year: 'numeric',
    }).format(kickoff)
}

const formatFixtureTime = (date: string | null) => {
    if (!date) return '--:--'

    const kickoff = new Date(date)
    if (Number.isNaN(kickoff.getTime())) return '--:--'

    return new Intl.DateTimeFormat('fr-FR', {
        hour: '2-digit',
        minute: '2-digit',
    }).format(kickoff)
}

const formatTimestamp = (timestamp: number | null) => timestamp !== null ? String(timestamp) : 'Non renseigne'

const formatTimezone = (timezone: string | null) => timezone ?? 'Non renseigne'

const formatWinner = (winner: boolean | null) => {
    if (winner === true) return 'Victoire'
    if (winner === false) return 'Defaite'
    return 'Non renseigne'
}

const getTeamScore = (score: number | null) => score ?? '-'

const hasPeriodScore = (home: number | null, away: number | null) =>
    home !== null || away !== null

const hasOvertime = computed(() =>
    hasPeriodScore(fixture.value?.periods?.overtime.home ?? null, fixture.value?.periods?.overtime.away ?? null)
    || hasPeriodScore(fixture.value?.periods?.secondOvertime.home ?? null, fixture.value?.periods?.secondOvertime.away ?? null)
)

const getTeamClass = (winner: boolean | null) => ({
    winner: winner === true,
    loser: winner === false,
})

const stopScoreCelebration = () => {
    if (!scoreCelebrationTimer) return

    clearTimeout(scoreCelebrationTimer)
    scoreCelebrationTimer = null
}

const triggerScoreCelebration = (nextScoringSides: Array<'home' | 'away'>) => {
    if (nextScoringSides.length === 0) return

    stopScoreCelebration()
    scoringSides.value = nextScoringSides
    scoreCelebrationTimer = setTimeout(() => {
        scoringSides.value = []
        scoreCelebrationTimer = null
    }, 1800)
}

const detectScoreCelebration = (previousFixture: RugbyFixture | null, nextFixture: RugbyFixture) => {
    if (!previousFixture) return

    const nextScoringSides: Array<'home' | 'away'> = []
    const previousHomeScore = previousFixture.score.home
    const nextHomeScore = nextFixture.score.home
    const previousAwayScore = previousFixture.score.away
    const nextAwayScore = nextFixture.score.away

    if (previousHomeScore !== null && nextHomeScore !== null && nextHomeScore > previousHomeScore) {
        nextScoringSides.push('home')
    }

    if (previousAwayScore !== null && nextAwayScore !== null && nextAwayScore > previousAwayScore) {
        nextScoringSides.push('away')
    }

    triggerScoreCelebration(nextScoringSides)
}

type FetchFixtureOptions = {
    liveRefresh?: boolean
    showPending?: boolean
    probeAfterFetch?: boolean
}

const stopLiveRefresh = () => {
    if (!liveRefreshTimer) return

    clearInterval(liveRefreshTimer)
    liveRefreshTimer = null
}

const fetchFixture = async ({ liveRefresh = false, showPending = true, probeAfterFetch = false }: FetchFixtureOptions = {}) => {
    const requestedMatchId = matchId.value
    if (!requestedMatchId) return

    if (showPending) {
        pending.value = true
        errorMessage.value = ''
    }

    try {
        const previousFixture = fixture.value
        const refreshedFixture = await apiFetch<RugbyFixture>(`/rugby/fixtures/${requestedMatchId}`, {
            cache: liveRefresh ? 'no-store' : undefined,
            query: liveRefresh ? { live: '1', t: String(Date.now()) } : undefined,
        })
        if (requestedMatchId !== matchId.value) return

        if (liveRefresh) {
            detectScoreCelebration(previousFixture, refreshedFixture)
        }
        fixture.value = refreshedFixture
        if (liveRefresh || isFixtureLive.value) {
            liveLastUpdatedAt.value = new Date()
        }
        if (!liveRefresh && probeAfterFetch && shouldAutoRefreshFixture.value) {
            startLiveRefresh()
        }
        if (!liveRefresh && shouldShowFixtureOdds.value) {
            void fetchFixtureOdds()
        }
        errorMessage.value = ''
    } catch (error) {
        if (showPending || !fixture.value) {
            fixture.value = null
            errorMessage.value = getApiErrorMessage(error)
        }
    } finally {
        if (showPending) pending.value = false
    }
}

const fetchFixtureOdds = async () => {
    const requestedMatchId = matchId.value
    if (!requestedMatchId || oddsPending.value) return

    oddsPending.value = true
    oddsErrorMessage.value = ''

    try {
        const nextOdds = await apiFetch<RugbyMatchOdds>(`/rugby/fixtures/${requestedMatchId}/odds`)
        if (requestedMatchId !== matchId.value) return

        odds.value = nextOdds
    } catch (error) {
        if (requestedMatchId !== matchId.value) return

        odds.value = null
        oddsErrorMessage.value = getApiErrorMessage(error)
    } finally {
        if (requestedMatchId === matchId.value) {
            oddsPending.value = false
        }
    }
}

const refreshLiveFixture = () => {
    if (liveRefreshInFlight) return

    liveRefreshInFlight = true
    void fetchFixture({ liveRefresh: true, showPending: false })
        .finally(() => {
            liveRefreshInFlight = false
        })
}

const startLiveRefresh = () => {
    if (!import.meta.client || liveRefreshTimer) return

    refreshLiveFixture()
    liveRefreshTimer = setInterval(refreshLiveFixture, LIVE_REFRESH_INTERVAL_MS)
}

const startLiveFollowTracking = () => {
    if (!import.meta.client || !matchId.value) return

    trackEntityView('LIVE_MATCH_FOLLOWED', matchId.value)
}

watch(matchId, () => {
    stopLiveRefresh()
    stopScoreCelebration()
    scoringSides.value = []
    odds.value = null
    oddsErrorMessage.value = ''
    liveLastUpdatedAt.value = null
    void fetchFixture({ probeAfterFetch: true })
}, { immediate: true })

watch(shouldShowFixtureOdds, (shouldShow) => {
    if (shouldShow && !odds.value) {
        void fetchFixtureOdds()
    }
})

watch(shouldAutoRefreshFixture, (shouldRefresh) => {
    if (shouldRefresh) {
        startLiveRefresh()
        return
    }

    stopLiveRefresh()
    liveLastUpdatedAt.value = null
})

watch(isFixtureLive, (isLive) => {
    if (isLive) {
        startLiveFollowTracking()
        return
    }

    if (!shouldAutoRefreshFixture.value) {
        liveLastUpdatedAt.value = null
    }
})

watch(fixture, (currentFixture) => {
    if (!currentFixture || !matchId.value) return

    trackEntityView('MATCH_VIEWED', matchId.value)

    if (isFixtureFinal.value) {
        trackEntityView('FINISHED_MATCH_VIEWED', matchId.value)
    }
})

onBeforeUnmount(() => {
    stopLiveRefresh()
    stopScoreCelebration()
})

useHead(() => ({
    title: fixture.value
        ? `RugbyJam | ${matchTitle.value}`
        : 'RugbyJam | Match',
}))
</script>

<template>
    <main class="match-page match-detail-page">
        <section class="match-page-shell match-detail-shell" aria-labelledby="match-detail-title">
            <NuxtLink to="/match" class="match-detail-back">
                <svg
                    class="match-detail-back-icon"
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                >
                    <path
                        d="M19 12H5M12 19l-7-7 7-7"
                        stroke="currentColor"
                        stroke-width="2"
                        stroke-linecap="round"
                        stroke-linejoin="round"
                    />
                </svg>
                Retour aux matchs
            </NuxtLink>

            <div v-if="pending" class="match-page-state">
                <AppLoader label="Chargement du match..." />
            </div>

            <div v-else-if="errorMessage" class="match-page-state error">
                {{ errorMessage }}
            </div>

            <template v-else-if="fixture">
                <article class="match-detail-card">
                    <header class="match-detail-header">
                        <div class="match-detail-competition">
                            <img
                                :src="fixture.league.logo || RUGBY_PLACEHOLDER_LOGO"
                                :alt="fixture.league.name ?? 'Competition'"
                                class="match-detail-competition-logo"
                                @error="setRugbyPlaceholderLogo"
                            >
                            <div>
                                <p class="match-page-eyebrow">
                                    <NuxtLink
                                        v-if="fixture.league.id"
                                        :to="{ path: `/leagues/${fixture.league.id}`, query: fixture.league.season ? { season: String(fixture.league.season) } : {} }"
                                        class="match-detail-competition-link"
                                    >
                                        {{ fixture.league.name ?? 'Competition' }}
                                    </NuxtLink>
                                    <span v-else>{{ fixture.league.name ?? 'Competition' }}</span>
                                    <span v-if="fixture.league.season"> / Saison {{ fixture.league.season }}</span>
                                </p>
                            </div>
                        </div>
                    </header>

                    <div class="match-detail-meta-strip">
                        <span>{{ formatFixtureDate(fixture.date) }}</span>
                        <strong>{{ fixture.league.round ?? 'Match' }}</strong>
                    </div>

                    <section class="match-detail-scoreboard" aria-label="Score du match">
                        <div class="match-detail-team" :class="getTeamClass(fixture.teams.home.winner)">
                            <NuxtLink
                                v-if="getFixtureTeamPath(fixture, fixture.teams.home.id)"
                                :to="getFixtureTeamPath(fixture, fixture.teams.home.id)"
                                class="match-detail-team-link"
                            >
                                <img
                                    :src="fixture.teams.home.logo || RUGBY_PLACEHOLDER_LOGO"
                                    :alt="fixture.teams.home.name ?? 'Équipe domicile'"
                                    :class="{ 'is-score-celebrating': scoringSides.includes('home') }"
                                    @error="setRugbyPlaceholderLogo"
                                >
                                <span>{{ fixture.teams.home.name ?? 'Équipe domicile' }}</span>
                            </NuxtLink>
                            <template v-else>
                                <img
                                    :src="fixture.teams.home.logo || RUGBY_PLACEHOLDER_LOGO"
                                    :alt="fixture.teams.home.name ?? 'Équipe domicile'"
                                    :class="{ 'is-score-celebrating': scoringSides.includes('home') }"
                                    @error="setRugbyPlaceholderLogo"
                                >
                                <span>{{ fixture.teams.home.name ?? 'Équipe domicile' }}</span>
                            </template>
                            <small>Domicile</small>
                        </div>

                        <div class="match-detail-score">
                            <span>{{ statusLabel }}</span>
                            <strong v-if="hasScore">
                                <b>{{ getTeamScore(fixture.score.home) }}</b>
                                <i>-</i>
                                <b>{{ getTeamScore(fixture.score.away) }}</b>
                            </strong>
                            <strong v-else>{{ formatFixtureTime(fixture.date) }}</strong>
                            <em v-if="fixture.status.elapsed">Temps de jeu {{ fixture.status.elapsed }}'</em>
                            <em v-else>{{ hasScore ? 'Score final' : 'Coup d’envoi' }}</em>
                            <div
                                v-if="isFixtureLive"
                                class="match-detail-live-refresh"
                                aria-live="polite"
                            >
                                <span>Direct</span>
                                <small>
                                    Actualisation automatique
                                    <template v-if="liveLastUpdatedLabel">
                                        / {{ liveLastUpdatedLabel }}
                                    </template>
                                </small>
                            </div>
                        </div>

                        <div class="match-detail-team away" :class="getTeamClass(fixture.teams.away.winner)">
                            <NuxtLink
                                v-if="getFixtureTeamPath(fixture, fixture.teams.away.id)"
                                :to="getFixtureTeamPath(fixture, fixture.teams.away.id)"
                                class="match-detail-team-link away"
                            >
                                <img
                                    :src="fixture.teams.away.logo || RUGBY_PLACEHOLDER_LOGO"
                                    :alt="fixture.teams.away.name ?? 'Équipe extérieure'"
                                    :class="{ 'is-score-celebrating': scoringSides.includes('away') }"
                                    @error="setRugbyPlaceholderLogo"
                                >
                                <span>{{ fixture.teams.away.name ?? 'Équipe extérieure' }}</span>
                            </NuxtLink>
                            <template v-else>
                                <span>{{ fixture.teams.away.name ?? 'Équipe extérieure' }}</span>
                                <img
                                    :src="fixture.teams.away.logo || RUGBY_PLACEHOLDER_LOGO"
                                    :alt="fixture.teams.away.name ?? 'Équipe extérieure'"
                                    :class="{ 'is-score-celebrating': scoringSides.includes('away') }"
                                    @error="setRugbyPlaceholderLogo"
                                >
                            </template>
                            <small>Exterieur</small>
                        </div>
                    </section>

                </article>

                <section
                    v-if="shouldShowFixtureOdds"
                    class="match-detail-odds"
                    aria-label="Cotes du match"
                >
                    <MatchOddsPanel
                        :fixture="fixture"
                        :odds="odds"
                        :pending="oddsPending"
                        :error-message="oddsErrorMessage"
                        :is-live="isFixtureLive"
                    />
                </section>

                <section
                    v-if="hasScore"
                    class="match-page-section match-detail-score-breakdown"
                    aria-labelledby="match-detail-score-breakdown-title"
                >
                    <div class="match-page-section-heading">
                        <div>
                            <p class="match-page-eyebrow">Details</p>
                            <h2 id="match-detail-score-breakdown-title">Detail du score</h2>
                        </div>
                    </div>

                    <div class="match-detail-score-card">
                        <div class="match-detail-score-row match-detail-score-row-head">
                            <span>Periode</span>
                            <strong>{{ fixture.teams.home.name ?? 'Domicile' }}</strong>
                            <strong>{{ fixture.teams.away.name ?? 'Exterieur' }}</strong>
                        </div>

                        <div class="match-detail-score-row">
                            <span>Mi-temps</span>
                            <strong>{{ fixture.periods?.first.home ?? '-' }}</strong>
                            <strong>{{ fixture.periods?.first.away ?? '-' }}</strong>
                        </div>

                        <div class="match-detail-score-row">
                            <span>Deuxieme periode</span>
                            <strong>{{ fixture.periods?.second.home ?? '-' }}</strong>
                            <strong>{{ fixture.periods?.second.away ?? '-' }}</strong>
                        </div>

                        <template v-if="hasOvertime">
                            <div class="match-detail-score-row">
                                <span>Prolongation</span>
                                <strong>{{ fixture.periods?.overtime.home ?? '-' }}</strong>
                                <strong>{{ fixture.periods?.overtime.away ?? '-' }}</strong>
                            </div>

                            <div
                                v-if="hasPeriodScore(fixture.periods?.secondOvertime.home ?? null, fixture.periods?.secondOvertime.away ?? null)"
                                class="match-detail-score-row"
                            >
                                <span>Deuxieme prolongation</span>
                                <strong>{{ fixture.periods?.secondOvertime.home ?? '-' }}</strong>
                                <strong>{{ fixture.periods?.secondOvertime.away ?? '-' }}</strong>
                            </div>
                        </template>

                        <div class="match-detail-score-row match-detail-score-row-final">
                            <span>Score final</span>
                            <strong>{{ getTeamScore(fixture.score.home) }}</strong>
                            <strong>{{ getTeamScore(fixture.score.away) }}</strong>
                        </div>
                    </div>
                </section>

                <section
                    class="match-page-section match-detail-info"
                    aria-labelledby="match-detail-info-title"
                >
                    <div class="match-page-section-heading">
                        <div>
                            <p class="match-page-eyebrow">Informations</p>
                            <h2 id="match-detail-info-title">Informations</h2>
                        </div>
                    </div>

                    <dl class="match-detail-info-grid">
                        <div>
                            <dt>Competition</dt>
                            <dd>{{ fixture.league.name ?? 'Non renseignee' }}</dd>
                        </div>
                        <div>
                            <dt>Saison</dt>
                            <dd>{{ fixture.league.season ?? 'Non renseignee' }}</dd>
                        </div>
                        <div>
                            <dt>Journée</dt>
                            <dd>{{ fixture.league.round ?? 'Non renseignee' }}</dd>
                        </div>
                        <div>
                            <dt>Statut</dt>
                            <dd>{{ fixture.status.long ?? fixture.status.short ?? 'Non renseigne' }}</dd>
                        </div>
                        <div>
                            <dt>Coup d'envoi</dt>
                            <dd>{{ formatFixtureKickoff(fixture.date) }}</dd>
                        </div>
                    </dl>
                </section>
            </template>
        </section>
    </main>
</template>
