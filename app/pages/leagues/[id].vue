<script setup lang="ts">
import '~/assets/css/components/leagues.css'
import type { RugbyFixture, RugbyLeagueOverview, RugbyStandingGroup } from '~/types/rugby'
import {
    RUGBY_PLACEHOLDER_LOGO,
    setRugbyPlaceholderLogo,
} from '~/composables/useRugbyLeagues'

definePageMeta({
    middleware: 'auth',
})

const route = useRoute()
const router = useRouter()
const leagueId = computed(() => String(route.params.id))
const competitionView = ref<'pools' | 'bracket'>('pools')
const requestedSeason = ref<number | null>(
    typeof route.query.season === 'string' && !Number.isNaN(Number(route.query.season))
        ? Number(route.query.season)
        : null
)

type BracketRound = {
    name: string
    fixtures: RugbyFixture[]
}

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
const showPools = computed(() => !isTournament.value || competitionView.value === 'pools')
const showBracket = computed(() => isTournament.value && competitionView.value === 'bracket')
const showLeaguePlayoffMatches = computed(() => !isTournament.value && bracketRounds.value.length > 0)
const hasVisibleContent = computed(() =>
    (showPools.value && hasStandings.value)
    || (showBracket.value && bracketRounds.value.length > 0)
    || showLeaguePlayoffMatches.value
)

const formatStandingValue = (value: number | null) => value ?? '-'
const formatFixtureScore = (fixture: RugbyFixture) => {
    if (fixture.score.home === null || fixture.score.away === null) return '-'
    return `${fixture.score.home} - ${fixture.score.away}`
}
const formatFixtureDate = (date: string | null) => {
    if (!date) return 'Date a venir'

    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
    }).format(new Date(date))
}

const refreshLeague = () => {
    void refresh()
}

const updateSeason = (event: Event) => {
    const target = event.target as HTMLSelectElement
    const season = Number(target.value)

    if (!Number.isInteger(season)) return

    requestedSeason.value = season
    competitionView.value = 'pools'
    void router.replace({
        query: {
            ...route.query,
            season: String(season),
        },
    })
}

watch(requestedSeason, () => {
    void refresh()
})

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

                <div class="season-filter">
                    <label for="league-season-select">
                        <span>Saison</span>
                        <select
                            id="league-season-select"
                            :value="selectedSeason ?? ''"
                            :disabled="!canSelectSeason || pending"
                            @change="updateSeason"
                        >
                            <option
                                v-for="season in seasonOptions"
                                :key="season"
                                :value="season"
                            >
                                {{ season }}
                            </option>
                        </select>
                    </label>
                </div>

                <div
                    v-if="isTournament"
                    class="competition-mode-switch"
                    role="tablist"
                    aria-label="Vue de la competition"
                >
                    <button
                        type="button"
                        class="competition-mode-button"
                        :class="{ active: competitionView === 'pools' }"
                        role="tab"
                        :aria-selected="competitionView === 'pools'"
                        @click="competitionView = 'pools'"
                    >
                        Poules
                    </button>
                    <button
                        type="button"
                        class="competition-mode-button"
                        :class="{ active: competitionView === 'bracket' }"
                        role="tab"
                        :aria-selected="competitionView === 'bracket'"
                        @click="competitionView = 'bracket'"
                    >
                        Phase finale
                    </button>
                </div>

                <section
                    v-if="showPools && hasStandings"
                    class="standings-section"
                    aria-labelledby="standings-title"
                >
                    <div class="section-heading">
                        <p class="eyebrow">{{ isTournament ? 'Poules' : standingsGroup?.name ?? 'Classement' }}</p>
                    </div>

                    <div class="pool-standings-grid">
                        <article
                            v-for="group in displayedStandingGroups"
                            :key="group.name ?? 'Classement'"
                            class="pool-standings"
                        >
                            <h3 v-if="isTournament">{{ group.name ?? 'Poule' }}</h3>

                            <div class="standings-table-wrapper">
                                <table class="standings-table">
                                    <thead>
                                        <tr>
                                            <th scope="col">#</th>
                                            <th scope="col">Equipe</th>
                                            <th scope="col">J</th>
                                            <th scope="col">G</th>
                                            <th scope="col">N</th>
                                            <th scope="col">P</th>
                                            <th scope="col">+</th>
                                            <th scope="col">-</th>
                                            <th scope="col">Diff +/-</th>
                                            <th scope="col">Pts</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        <tr
                                            v-for="row in group.rows"
                                            :key="`${group.name}-${row.rank}-${row.team.id ?? row.team.name}`"
                                        >
                                            <td class="rank-cell">{{ formatStandingValue(row.rank) }}</td>
                                            <td>
                                                <div class="standing-team">
                                                    <img
                                                        :src="row.team.logo || RUGBY_PLACEHOLDER_LOGO"
                                                        :alt="row.team.name ?? 'Equipe'"
                                                        class="standing-team-logo"
                                                        @error="setRugbyPlaceholderLogo"
                                                    >
                                                    <span>{{ row.team.name ?? 'Equipe inconnue' }}</span>
                                                </div>
                                            </td>
                                            <td>{{ formatStandingValue(row.all.played) }}</td>
                                            <td>{{ formatStandingValue(row.all.win) }}</td>
                                            <td>{{ formatStandingValue(row.all.draw) }}</td>
                                            <td>{{ formatStandingValue(row.all.loss) }}</td>
                                            <td>{{ formatStandingValue(row.all.pointsFor) }}</td>
                                            <td>{{ formatStandingValue(row.all.pointsAgainst) }}</td>
                                            <td>{{ formatStandingValue(row.pointsDiff) }}</td>
                                            <td class="points-cell">{{ formatStandingValue(row.points) }}</td>
                                        </tr>
                                    </tbody>
                                </table>
                            </div>
                        </article>
                    </div>
                </section>

                <section
                    v-if="showBracket && bracketRounds.length"
                    class="bracket-section"
                    aria-labelledby="bracket-title"
                >
                    <div class="section-heading">
                        <p class="eyebrow">Phase finale</p>
                    </div>

                    <div class="bracket-rounds">
                        <section
                            v-for="(round, roundIndex) in bracketRounds"
                            :key="round.name"
                            class="bracket-round"
                            :class="{
                                'is-first-round': roundIndex === 0,
                                'is-last-round': roundIndex === bracketRounds.length - 1,
                            }"
                        >
                            <h3>{{ round.name }}</h3>

                            <div class="bracket-match-list">
                                <article
                                    v-for="fixture in round.fixtures"
                                    :key="fixture.id ?? `${fixture.teams.home.name}-${fixture.teams.away.name}`"
                                    class="bracket-match"
                                >
                                    <p class="bracket-date">{{ formatFixtureDate(fixture.date) }}</p>
                                    <div class="bracket-team-row">
                                        <span>{{ fixture.teams.home.name ?? 'Equipe domicile' }}</span>
                                        <strong>{{ formatStandingValue(fixture.score.home) }}</strong>
                                    </div>
                                    <div class="bracket-team-row">
                                        <span>{{ fixture.teams.away.name ?? 'Equipe exterieure' }}</span>
                                        <strong>{{ formatStandingValue(fixture.score.away) }}</strong>
                                    </div>
                                    <p class="bracket-score">{{ formatFixtureScore(fixture) }}</p>
                                </article>
                            </div>
                        </section>
                    </div>
                </section>

                <section
                    v-if="showLeaguePlayoffMatches"
                    class="playoff-section"
                    aria-labelledby="playoff-title"
                >
                    <div class="section-heading">
                        <p id="playoff-title" class="eyebrow">Phase finale</p>
                    </div>

                    <div class="playoff-round-list">
                        <section
                            v-for="round in bracketRounds"
                            :key="round.name"
                            class="playoff-round"
                        >
                            <h3>{{ round.name }}</h3>

                            <div class="playoff-match-grid">
                                <article
                                    v-for="fixture in round.fixtures"
                                    :key="fixture.id ?? `${fixture.teams.home.name}-${fixture.teams.away.name}`"
                                    class="playoff-match"
                                >
                                    <div class="playoff-match-heading">
                                        <p class="bracket-date">{{ formatFixtureDate(fixture.date) }}</p>
                                        <p class="bracket-score">{{ formatFixtureScore(fixture) }}</p>
                                    </div>

                                    <div class="bracket-team-row">
                                        <span>{{ fixture.teams.home.name ?? 'Equipe domicile' }}</span>
                                        <strong>{{ formatStandingValue(fixture.score.home) }}</strong>
                                    </div>
                                    <div class="bracket-team-row">
                                        <span>{{ fixture.teams.away.name ?? 'Equipe exterieure' }}</span>
                                        <strong>{{ formatStandingValue(fixture.score.away) }}</strong>
                                    </div>
                                </article>
                            </div>
                        </section>
                    </div>
                </section>

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
