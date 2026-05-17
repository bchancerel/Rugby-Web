<script setup lang="ts">
import '~/assets/css/components/leagues.css'
import LeagueDetailHero from '~/components/leagues/LeagueDetailHero.vue'
import LeagueKnockoutSection from '~/components/leagues/LeagueKnockoutSection.vue'
import LeagueMatchesSection from '~/components/leagues/LeagueMatchesSection.vue'
import LeagueModeSwitch from '~/components/leagues/LeagueModeSwitch.vue'
import LeagueSeasonSelect from '~/components/leagues/LeagueSeasonSelect.vue'
import LeagueStandingsSection from '~/components/leagues/LeagueStandingsSection.vue'
import type { RugbyFixture, RugbyLeagueOverview, RugbyStandingGroup } from '~/types/rugby'

definePageMeta({
    middleware: 'auth',
})

const route = useRoute()
const router = useRouter()
const leagueId = computed(() => String(route.params.id))
const competitionView = ref<'pools' | 'bracket'>('pools')
const selectedMatchRoundIndex = ref(0)
const shouldAutoSelectMatchRound = ref(true)
const requestedSeason = ref<number | null>(
    typeof route.query.season === 'string' && !Number.isNaN(Number(route.query.season))
        ? Number(route.query.season)
        : null
)

type BracketRound = {
    name: string
    fixtures: RugbyFixture[]
}

type MatchRound = BracketRound & {
    label: string
}

const UPCOMING_ROUND_THRESHOLD_MS = 48 * 60 * 60 * 1000

const { data: overview, error, pending, refresh } = await useApiFetch<RugbyLeagueOverview | null>(
    () => {
        const season = requestedSeason.value
        const path = `/rugby/leagues/${leagueId.value}/overview`

        return season ? `${path}?season=${season}` : path
    },
    {
        default: () => null,
    }
)

const league = computed(() => overview.value?.league ?? null)
const seasonOptions = computed(() => {
    const seasons = league.value?.seasons
        .map((season) => season.year)
        .filter((year): year is number => year !== null) ?? []

    if (overview.value?.season && !seasons.includes(overview.value.season)) {
        seasons.push(overview.value.season)
    }

    return [...new Set(seasons)].sort((a, b) => b - a)
})
const selectedSeason = computed(() => requestedSeason.value ?? overview.value?.season ?? null)
const canSelectSeason = computed(() => seasonOptions.value.length > 1)
const standingsGroup = computed(() => overview.value?.standings[0] ?? null)
const standingsGroups = computed(() => overview.value?.standings ?? [])
const hasStandings = computed(() => standingsGroups.value.some((group) => group.rows.length > 0))
const seasonLabel = computed(() => overview.value?.season ? `Saison ${overview.value.season}` : null)
const competitionMeta = computed(() => {
    if (!league.value) return ''

    return [league.value.type, seasonLabel.value].filter(Boolean).join(' / ')
})
const knockoutKeywords = ['final', 'semi', 'quarter', 'round of', 'knockout', 'playoff', 'play-off', 'barrage', 'accession']
const isKnockoutRound = (round: string | null) => {
    if (!round) return false

    const value = round.toLowerCase()
    return knockoutKeywords.some((keyword) => value.includes(keyword))
}
const bracketRounds = computed<BracketRound[]>(() => {
    const rounds = overview.value?.rounds.filter(isKnockoutRound) ?? []
    const fixtures = overview.value?.fixtures ?? []

    return rounds
        .map((roundName) => ({
            name: roundName,
            fixtures: fixtures.filter((fixture) => fixture.league.round === roundName),
        }))
        .filter((round) => round.fixtures.length > 0)
})
const formatRoundLabel = (round: string) => {
    const value = round.toLowerCase()
    const regularSeasonMatch = round.match(/regular season\s*-\s*(\d+)/i)
        ?? round.match(/(?:round|journee|matchday)\s*[- ]\s*(\d+)/i)

    if (regularSeasonMatch?.[1]) return `Journee ${regularSeasonMatch[1]}`
    if (value.includes('round of 16')) return 'Huitiemes de finale'
    if (value.includes('round of 8') || value.includes('quarter')) return 'Quarts de finale'
    if (value.includes('semi')) return 'Demi-finales'
    if (value.includes('final')) return 'Finale'
    if (value.includes('playoff') || value.includes('play-off') || value.includes('barrage')) return 'Barrages'

    return round
}
const matchRounds = computed<MatchRound[]>(() => {
    const fixtures = overview.value?.fixtures ?? []
    const roundNames = overview.value?.rounds ?? []
    const groupedFixtures = new Map<string, RugbyFixture[]>()

    for (const fixture of fixtures) {
        const roundName = fixture.league.round ?? 'Matchs'
        groupedFixtures.set(roundName, [...(groupedFixtures.get(roundName) ?? []), fixture])
    }

    const orderedRoundNames = [
        ...roundNames.filter((roundName) => groupedFixtures.has(roundName)),
        ...Array.from(groupedFixtures.keys()).filter((roundName) => !roundNames.includes(roundName)),
    ]

    return orderedRoundNames.map((roundName) => ({
        name: roundName,
        label: formatRoundLabel(roundName),
        fixtures: [...(groupedFixtures.get(roundName) ?? [])].sort((a, b) => {
            const firstKickoff = a.timestamp ?? (a.date ? new Date(a.date).getTime() / 1000 : 0)
            const secondKickoff = b.timestamp ?? (b.date ? new Date(b.date).getTime() / 1000 : 0)

            return firstKickoff - secondKickoff
        }),
    }))
})
const getFixtureKickoffTime = (fixture: RugbyFixture) => {
    if (fixture.timestamp !== null) return fixture.timestamp * 1000
    if (!fixture.date) return null

    const kickoff = new Date(fixture.date).getTime()
    return Number.isNaN(kickoff) ? null : kickoff
}
const getRoundKickoffTimes = (round: MatchRound) =>
    round.fixtures
        .map(getFixtureKickoffTime)
        .filter((kickoff): kickoff is number => kickoff !== null)
const findDefaultMatchRoundIndex = (rounds: MatchRound[]) => {
    if (rounds.length === 0) return 0

    const now = Date.now()
    const nextRound = rounds
        .map((round, index) => ({
            index,
            kickoff: getRoundKickoffTimes(round)
                .filter((kickoff) => kickoff >= now)
                .sort((a, b) => a - b)[0] ?? null,
        }))
        .filter((round): round is { index: number, kickoff: number } => round.kickoff !== null)
        .sort((a, b) => a.kickoff - b.kickoff)[0] ?? null

    if (nextRound && nextRound.kickoff - now <= UPCOMING_ROUND_THRESHOLD_MS) {
        return nextRound.index
    }

    const lastPlayedRound = rounds
        .map((round, index) => ({
            index,
            kickoff: getRoundKickoffTimes(round)
                .filter((kickoff) => kickoff < now)
                .sort((a, b) => b - a)[0] ?? null,
        }))
        .filter((round): round is { index: number, kickoff: number } => round.kickoff !== null)
        .sort((a, b) => b.kickoff - a.kickoff)[0] ?? null

    return lastPlayedRound?.index ?? nextRound?.index ?? 0
}
const selectedMatchRound = computed(() => matchRounds.value[selectedMatchRoundIndex.value] ?? null)
const hasMatchRounds = computed(() => matchRounds.value.length > 0)
const canGoToPreviousMatchRound = computed(() => selectedMatchRoundIndex.value > 0)
const canGoToNextMatchRound = computed(() => selectedMatchRoundIndex.value < matchRounds.value.length - 1)
const matchRoundControlLabel = computed(() =>
    matchRounds.value.some((round) => isKnockoutRound(round.name)) ? 'Tour' : 'Journee'
)
const isCupCompetition = computed(() => {
    const type = league.value?.type?.toLowerCase() ?? ''
    return type.includes('cup') || type.includes('tour')
})
const isTournament = computed(() => {
    return isCupCompetition.value || standingsGroups.value.length > 1
})
const displayedStandingGroups = computed<RugbyStandingGroup[]>(() =>
    isTournament.value ? standingsGroups.value : standingsGroup.value ? [standingsGroup.value] : []
)
const standingsHeading = computed(() => isTournament.value ? 'Poules' : standingsGroup.value?.name ?? 'Classement')
const showPools = computed(() => !isTournament.value || competitionView.value === 'pools')
const showBracket = computed(() => isTournament.value && competitionView.value === 'bracket')
const showLeaguePlayoffMatches = computed(() => !isTournament.value && bracketRounds.value.length > 0)
const hasVisibleContent = computed(() =>
    (showPools.value && hasStandings.value)
    || (showBracket.value && bracketRounds.value.length > 0)
    || showLeaguePlayoffMatches.value
    || hasMatchRounds.value
)

const refreshLeague = () => {
    void refresh()
}

const goToPreviousMatchRound = () => {
    if (!canGoToPreviousMatchRound.value) return
    shouldAutoSelectMatchRound.value = false
    selectedMatchRoundIndex.value -= 1
}

const goToNextMatchRound = () => {
    if (!canGoToNextMatchRound.value) return
    shouldAutoSelectMatchRound.value = false
    selectedMatchRoundIndex.value += 1
}

const updateMatchRound = (roundIndex: number) => {
    if (!Number.isInteger(roundIndex) || roundIndex < 0 || roundIndex >= matchRounds.value.length) return

    shouldAutoSelectMatchRound.value = false
    selectedMatchRoundIndex.value = roundIndex
}

const updateSeason = (season: number) => {
    if (!Number.isInteger(season)) return

    requestedSeason.value = season
    competitionView.value = 'pools'
    shouldAutoSelectMatchRound.value = true
    selectedMatchRoundIndex.value = 0
    void router.replace({
        query: {
            ...route.query,
            season: String(season),
        },
    })
}

watch(requestedSeason, () => {
    shouldAutoSelectMatchRound.value = true
    selectedMatchRoundIndex.value = 0
    void refresh()
})

watch(matchRounds, (rounds) => {
    if (rounds.length === 0) return

    if (shouldAutoSelectMatchRound.value) {
        selectedMatchRoundIndex.value = findDefaultMatchRoundIndex(rounds)
        shouldAutoSelectMatchRound.value = false
        return
    }

    if (selectedMatchRoundIndex.value >= rounds.length) {
        selectedMatchRoundIndex.value = Math.max(rounds.length - 1, 0)
    }
}, { immediate: true })

watch(
    () => route.query.season,
    (season) => {
        const nextSeason = typeof season === 'string' && !Number.isNaN(Number(season)) ? Number(season) : null
        if (nextSeason !== requestedSeason.value) requestedSeason.value = nextSeason
    }
)

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
                <svg
                    class="detail-back-icon"
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

            <template v-else-if="league">
                <LeagueDetailHero
                    :league="league"
                    :competition-meta="competitionMeta"
                />

                <LeagueSeasonSelect
                    :selected-season="selectedSeason"
                    :season-options="seasonOptions"
                    :can-select-season="canSelectSeason"
                    :pending="pending"
                    @change="updateSeason"
                />

                <LeagueModeSwitch
                    v-if="isTournament"
                    v-model="competitionView"
                />

                <LeagueStandingsSection
                    v-if="showPools && hasStandings"
                    :groups="displayedStandingGroups"
                    :is-tournament="isTournament"
                    :heading="standingsHeading"
                />

                <LeagueKnockoutSection
                    v-if="showBracket && bracketRounds.length"
                    :rounds="bracketRounds"
                    variant="bracket"
                />

                <LeagueKnockoutSection
                    v-if="showLeaguePlayoffMatches"
                    :rounds="bracketRounds"
                    variant="playoff"
                />

                <LeagueMatchesSection
                    v-if="selectedMatchRound"
                    :selected-round="selectedMatchRound"
                    :rounds="matchRounds"
                    :selected-round-index="selectedMatchRoundIndex"
                    :can-go-to-previous="canGoToPreviousMatchRound"
                    :can-go-to-next="canGoToNextMatchRound"
                    :control-label="matchRoundControlLabel"
                    @previous="goToPreviousMatchRound"
                    @next="goToNextMatchRound"
                    @select-round="updateMatchRound"
                />

                <section v-if="!hasVisibleContent" class="empty-state">
                    <p>
                        {{ showBracket ? 'Aucune phase finale disponible pour cette saison.' : 'Aucun classement disponible pour cette saison.' }}
                        <span>Les donnees API peuvent varier selon la competition.</span>
                    </p>
                </section>
            </template>

            <div v-else class="state">
                Competition introuvable.
            </div>
        </section>
    </main>
</template>
