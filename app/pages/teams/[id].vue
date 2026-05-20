<script setup lang="ts">
import FavoriteButton from '~/components/favorites/FavoriteButton.vue'
import {
    RUGBY_PLACEHOLDER_LOGO,
    setRugbyPlaceholderLogo,
} from '~/composables/useRugbyLeagues'
import type { RugbyFixture, RugbyTeamContext, RugbyTeamStatistics, RugbyTeamStatisticsRecord } from '~/types/rugby'

definePageMeta({
    middleware: 'auth',
})

const route = useRoute()
const config = useRuntimeConfig()
const { getFixtureMatchPath, getFixtureTeamPath } = useRugbyTeamLinks()

const statistics = ref<RugbyTeamStatistics | null>(null)
const contexts = ref<RugbyTeamContext[]>([])
const fixtures = ref<RugbyFixture[]>([])
const pending = ref(false)
const contextsPending = ref(false)
const fixturesPending = ref(false)
const errorMessage = ref('')
const contextsErrorMessage = ref('')
const fixturesErrorMessage = ref('')

const teamId = computed(() => String(route.params.id ?? ''))
const leagueId = computed(() => String(route.query.league ?? ''))
const season = computed(() => String(route.query.season ?? ''))
const hasStatisticsContext = computed(() => Boolean(teamId.value && leagueId.value && season.value))
const backPath = computed(() =>
    hasStatisticsContext.value
        ? { path: `/leagues/${leagueId.value}`, query: { season: season.value } }
        : '/favoris'
)
const backLabel = computed(() => hasStatisticsContext.value ? 'Retour au championnat' : 'Retour aux favoris')
const selectedContextKey = computed(() => hasStatisticsContext.value ? `${leagueId.value}:${season.value}` : '')
const selectedContext = computed(() =>
    contexts.value.find((context) => `${context.league.id}:${context.league.season}` === selectedContextKey.value) ?? null
)
const groupedContexts = computed(() => {
    const groups = new Map<string, RugbyTeamContext[]>()

    for (const context of contexts.value) {
        const leagueKey = String(context.league.id)
        groups.set(leagueKey, [...(groups.get(leagueKey) ?? []), context])
    }

    return Array.from(groups.values())
        .filter((leagueContexts): leagueContexts is [RugbyTeamContext, ...RugbyTeamContext[]] => leagueContexts.length > 0)
        .map((leagueContexts) => ({
            league: leagueContexts[0].league,
            seasons: [...leagueContexts].sort((a, b) => b.league.season - a.league.season),
        }))
        .sort((a, b) => (a.league.name ?? '').localeCompare(b.league.name ?? ''))
})
const selectedLeagueGroup = computed(() =>
    groupedContexts.value.find((group) => String(group.league.id) === leagueId.value) ?? null
)

const getApiErrorMessage = (error: unknown) => {
    const apiError = error as { data?: { message?: string }, message?: string }
    return apiError.data?.message || apiError.message || 'Statistiques indisponibles.'
}

const formatValue = (value: number | null) => value ?? '-'

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

const getFixtureTime = (fixture: RugbyFixture) => {
    if (fixture.timestamp !== null) return fixture.timestamp
    if (!fixture.date) return 0

    const time = new Date(fixture.date).getTime()
    return Number.isNaN(time) ? 0 : Math.round(time / 1000)
}

const teamFixtures = computed(() =>
    [...fixtures.value].sort((a, b) => getFixtureTime(a) - getFixtureTime(b))
)

const getPointDiff = (record: RugbyTeamStatisticsRecord) => {
    if (record.pointsFor === null || record.pointsAgainst === null) return null
    return record.pointsFor - record.pointsAgainst
}

const getWinRate = (record: RugbyTeamStatisticsRecord) => {
    if (!record.played || record.win === null) return null
    return Math.round((record.win / record.played) * 100)
}

const hasAnyStatistic = (record: RugbyTeamStatisticsRecord) =>
    Object.values(record).some((value) => value !== null)

const fetchContexts = async () => {
    if (!teamId.value) return

    contextsPending.value = true
    contextsErrorMessage.value = ''

    try {
        const baseURL = import.meta.server ? config.apiBase : config.public.apiBase
        contexts.value = await $fetch<RugbyTeamContext[]>(`/rugby/teams/${teamId.value}/contexts`, {
            baseURL,
            credentials: 'include',
        })
    } catch (error) {
        contexts.value = []
        contextsErrorMessage.value = getApiErrorMessage(error)
    } finally {
        contextsPending.value = false
    }
}

const fetchStatistics = async () => {
    if (!hasStatisticsContext.value) {
        statistics.value = null
        errorMessage.value = ''
        return
    }

    pending.value = true
    errorMessage.value = ''

    try {
        const baseURL = import.meta.server ? config.apiBase : config.public.apiBase

        statistics.value = await $fetch<RugbyTeamStatistics>(`/rugby/teams/${teamId.value}/statistics`, {
            baseURL,
            credentials: 'include',
            query: {
                league: leagueId.value,
                season: season.value,
            },
        })
    } catch (error) {
        statistics.value = null
        errorMessage.value = getApiErrorMessage(error)
    } finally {
        pending.value = false
    }
}

const fetchFixtures = async () => {
    if (!hasStatisticsContext.value) {
        fixtures.value = []
        fixturesErrorMessage.value = ''
        return
    }

    fixturesPending.value = true
    fixturesErrorMessage.value = ''

    try {
        const baseURL = import.meta.server ? config.apiBase : config.public.apiBase

        fixtures.value = await $fetch<RugbyFixture[]>('/rugby/fixtures', {
            baseURL,
            credentials: 'include',
            query: {
                team: teamId.value,
                league: leagueId.value,
                season: season.value,
            },
        })
    } catch (error) {
        fixtures.value = []
        fixturesErrorMessage.value = getApiErrorMessage(error)
    } finally {
        fixturesPending.value = false
    }
}

const updateContext = (contextKey: string) => {
    const [nextLeagueId, nextSeason] = contextKey.split(':')
    if (!nextLeagueId || !nextSeason) return

    void navigateTo({
        path: `/teams/${teamId.value}`,
        query: {
            league: nextLeagueId,
            season: nextSeason,
        },
    })
}

const updateLeague = (nextLeagueId: string) => {
    const group = groupedContexts.value.find((item) => String(item.league.id) === nextLeagueId)
    const latestSeason = group?.seasons[0]?.league.season
    if (!latestSeason) return

    updateContext(`${nextLeagueId}:${latestSeason}`)
}

const updateSeason = (nextSeason: string) => {
    if (!leagueId.value || !nextSeason) return

    updateContext(`${leagueId.value}:${nextSeason}`)
}

watch(
    teamId,
    () => {
        void fetchContexts()
    },
    { immediate: true }
)

watch(
    () => [teamId.value, leagueId.value, season.value],
    () => {
        void fetchStatistics()
        void fetchFixtures()
    },
    { immediate: true }
)

useHead(() => ({
    title: statistics.value?.team.name
        ? `RugbyJam | ${statistics.value.team.name}`
        : 'RugbyJam | Equipe',
}))
</script>

<template>
    <main class="team-statistics-page">
        <section class="team-statistics-shell" aria-labelledby="team-statistics-title">
            <NuxtLink :to="backPath" class="team-statistics-back">{{ backLabel }}</NuxtLink>

            <section class="team-context-panel" aria-labelledby="team-context-title">
                <div>
                    <p id="team-context-title" class="team-statistics-eyebrow">Contexte</p>
                    <h2>Championnat et saison</h2>
                </div>

                <div v-if="contextsPending" class="team-context-state">
                    Chargement des contextes...
                </div>

                <div v-else-if="contextsErrorMessage" class="team-context-state error">
                    {{ contextsErrorMessage }}
                </div>

                <div v-else-if="contexts.length === 0" class="team-context-state">
                    Aucun championnat trouve pour cette equipe.
                </div>

                <div v-else class="team-context-selector">
                    <div>
                        <label for="team-league-select">Championnat</label>
                        <select
                            id="team-league-select"
                            :value="leagueId"
                            @change="updateLeague(($event.target as HTMLSelectElement).value)"
                        >
                            <option
                                value=""
                                disabled
                            >
                                Choisir un championnat
                            </option>
                            <option
                                v-for="group in groupedContexts"
                                :key="group.league.id"
                                :value="String(group.league.id)"
                            >
                                {{ group.league.name ?? `Championnat ${group.league.id}` }}
                            </option>
                        </select>
                    </div>

                    <div>
                        <label for="team-season-select">Saison</label>
                        <select
                            id="team-season-select"
                            :value="season"
                            :disabled="!selectedLeagueGroup"
                            @change="updateSeason(($event.target as HTMLSelectElement).value)"
                        >
                            <option
                                value=""
                                disabled
                            >
                                Choisir une saison
                            </option>
                            <option
                                v-for="context in selectedLeagueGroup?.seasons ?? []"
                                :key="`${context.league.id}-${context.league.season}`"
                                :value="String(context.league.season)"
                            >
                                {{ context.league.season }} - {{ context.fixturesCount }} matchs
                            </option>
                        </select>
                    </div>
                </div>
            </section>

            <div v-if="!hasStatisticsContext" class="team-statistics-empty">
                <p class="team-statistics-eyebrow">Equipe {{ teamId }}</p>
                <h1 id="team-statistics-title">Choisis un championnat</h1>
                <p>
                    Selectionne un championnat et une saison pour afficher les statistiques de cette equipe.
                </p>
            </div>

            <div v-else-if="pending" class="team-statistics-empty">
                Chargement des statistiques...
            </div>

            <div v-else-if="errorMessage" class="team-statistics-empty error">
                {{ errorMessage }}
            </div>

            <template v-else-if="statistics">
                <header class="team-statistics-header">
                    <img
                        :src="statistics.team.logo || RUGBY_PLACEHOLDER_LOGO"
                        :alt="statistics.team.name ?? 'Equipe'"
                        @error="setRugbyPlaceholderLogo"
                    >
                    <div>
                        <p class="team-statistics-eyebrow">
                            {{ selectedContext?.league.name ?? statistics.league.name ?? 'Competition' }} / Saison {{ statistics.league.season ?? season }}
                        </p>
                        <h1 id="team-statistics-title">{{ statistics.team.name ?? `Equipe ${teamId}` }}</h1>
                        <NuxtLink
                            v-if="statistics.league.id"
                            :to="{ path: `/leagues/${statistics.league.id}`, query: { season: String(statistics.league.season ?? season) } }"
                            class="team-statistics-league-link"
                        >
                            Voir le championnat
                        </NuxtLink>
                    </div>
                    <FavoriteButton
                        entity-type="team"
                        :entity-id="statistics.team.id ?? teamId"
                        :entity-name="statistics.team.name"
                    />
                </header>

                <section class="team-statistics-cards" aria-label="Resume">
                    <article>
                        <span>Matchs</span>
                        <strong>{{ formatValue(statistics.all.played) }}</strong>
                    </article>
                    <article>
                        <span>Victoires</span>
                        <strong>{{ formatValue(statistics.all.win) }}</strong>
                    </article>
                    <article>
                        <span>Taux de victoire</span>
                        <strong>{{ getWinRate(statistics.all) !== null ? `${getWinRate(statistics.all)}%` : '-' }}</strong>
                    </article>
                    <article>
                        <span>Diff points</span>
                        <strong>{{ formatValue(getPointDiff(statistics.all)) }}</strong>
                    </article>
                </section>

                <section class="team-statistics-table-section" aria-labelledby="team-statistics-records">
                    <div class="team-statistics-section-heading">
                        <h2 id="team-statistics-records">Performance</h2>
                        <p v-if="statistics.form">Forme: {{ statistics.form }}</p>
                    </div>

                    <div class="team-statistics-table-wrapper">
                        <table v-if="hasAnyStatistic(statistics.all)" class="team-statistics-table">
                            <thead>
                                <tr>
                                    <th scope="col">Zone</th>
                                    <th scope="col">J</th>
                                    <th scope="col">G</th>
                                    <th scope="col">N</th>
                                    <th scope="col">P</th>
                                    <th scope="col">+</th>
                                    <th scope="col">-</th>
                                    <th scope="col">Diff</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr>
                                    <th scope="row">Total</th>
                                    <td>{{ formatValue(statistics.all.played) }}</td>
                                    <td>{{ formatValue(statistics.all.win) }}</td>
                                    <td>{{ formatValue(statistics.all.draw) }}</td>
                                    <td>{{ formatValue(statistics.all.loss) }}</td>
                                    <td>{{ formatValue(statistics.all.pointsFor) }}</td>
                                    <td>{{ formatValue(statistics.all.pointsAgainst) }}</td>
                                    <td>{{ formatValue(getPointDiff(statistics.all)) }}</td>
                                </tr>
                                <tr>
                                    <th scope="row">Domicile</th>
                                    <td>{{ formatValue(statistics.home.played) }}</td>
                                    <td>{{ formatValue(statistics.home.win) }}</td>
                                    <td>{{ formatValue(statistics.home.draw) }}</td>
                                    <td>{{ formatValue(statistics.home.loss) }}</td>
                                    <td>{{ formatValue(statistics.home.pointsFor) }}</td>
                                    <td>{{ formatValue(statistics.home.pointsAgainst) }}</td>
                                    <td>{{ formatValue(getPointDiff(statistics.home)) }}</td>
                                </tr>
                                <tr>
                                    <th scope="row">Exterieur</th>
                                    <td>{{ formatValue(statistics.away.played) }}</td>
                                    <td>{{ formatValue(statistics.away.win) }}</td>
                                    <td>{{ formatValue(statistics.away.draw) }}</td>
                                    <td>{{ formatValue(statistics.away.loss) }}</td>
                                    <td>{{ formatValue(statistics.away.pointsFor) }}</td>
                                    <td>{{ formatValue(statistics.away.pointsAgainst) }}</td>
                                    <td>{{ formatValue(getPointDiff(statistics.away)) }}</td>
                                </tr>
                            </tbody>
                        </table>

                        <p v-else class="team-statistics-table-empty">
                            Les statistiques detaillees de cette equipe ne sont pas encore disponibles pour cette saison.
                        </p>
                    </div>
                </section>

                <section class="team-fixtures-section" aria-labelledby="team-fixtures-title">
                    <div class="team-statistics-section-heading">
                        <div>
                            <p class="team-statistics-eyebrow">Calendrier</p>
                            <h2 id="team-fixtures-title">Matchs de la saison</h2>
                        </div>
                        <p>{{ teamFixtures.length }} match{{ teamFixtures.length > 1 ? 's' : '' }}</p>
                    </div>

                    <div v-if="fixturesPending" class="team-fixtures-state">
                        Chargement des matchs...
                    </div>

                    <div v-else-if="fixturesErrorMessage" class="team-fixtures-state error">
                        {{ fixturesErrorMessage }}
                    </div>

                    <div v-else-if="teamFixtures.length === 0" class="team-fixtures-state">
                        Aucun match trouve pour cette equipe sur ce championnat et cette saison.
                    </div>

                    <div v-else class="team-fixtures-list">
                        <article
                            v-for="fixture in teamFixtures"
                            :key="fixture.id ?? `${fixture.date}-${fixture.teams.home.name}-${fixture.teams.away.name}`"
                            class="team-fixture-card"
                        >
                            <div class="team-fixture-meta">
                                <span>{{ fixture.league.round ? `Journee ${fixture.league.round}` : 'Match' }}</span>
                                <time>{{ formatFixtureKickoff(fixture.date) }}</time>
                            </div>

                            <div class="team-fixture-row">
                                <div class="team-fixture-team home">
                                    <NuxtLink
                                        v-if="getFixtureTeamPath(fixture, fixture.teams.home.id)"
                                        :to="getFixtureTeamPath(fixture, fixture.teams.home.id)"
                                        class="team-fixture-team-link"
                                    >
                                        <img
                                            :src="fixture.teams.home.logo || RUGBY_PLACEHOLDER_LOGO"
                                            :alt="fixture.teams.home.name ?? 'Equipe domicile'"
                                            @error="setRugbyPlaceholderLogo"
                                        >
                                        <span>{{ fixture.teams.home.name ?? 'Equipe domicile' }}</span>
                                    </NuxtLink>
                                    <template v-else>
                                        <img
                                            :src="fixture.teams.home.logo || RUGBY_PLACEHOLDER_LOGO"
                                            :alt="fixture.teams.home.name ?? 'Equipe domicile'"
                                            @error="setRugbyPlaceholderLogo"
                                        >
                                        <span>{{ fixture.teams.home.name ?? 'Equipe domicile' }}</span>
                                    </template>
                                </div>

                                <NuxtLink
                                    v-if="getFixtureMatchPath(fixture)"
                                    :to="getFixtureMatchPath(fixture)"
                                    class="team-fixture-score-link"
                                >
                                    {{ formatFixtureScore(fixture) }}
                                </NuxtLink>
                                <strong v-else>{{ formatFixtureScore(fixture) }}</strong>

                                <div class="team-fixture-team away">
                                    <NuxtLink
                                        v-if="getFixtureTeamPath(fixture, fixture.teams.away.id)"
                                        :to="getFixtureTeamPath(fixture, fixture.teams.away.id)"
                                        class="team-fixture-team-link"
                                    >
                                        <span>{{ fixture.teams.away.name ?? 'Equipe exterieure' }}</span>
                                        <img
                                            :src="fixture.teams.away.logo || RUGBY_PLACEHOLDER_LOGO"
                                            :alt="fixture.teams.away.name ?? 'Equipe exterieure'"
                                            @error="setRugbyPlaceholderLogo"
                                        >
                                    </NuxtLink>
                                    <template v-else>
                                        <span>{{ fixture.teams.away.name ?? 'Equipe exterieure' }}</span>
                                        <img
                                            :src="fixture.teams.away.logo || RUGBY_PLACEHOLDER_LOGO"
                                            :alt="fixture.teams.away.name ?? 'Equipe exterieure'"
                                            @error="setRugbyPlaceholderLogo"
                                        >
                                    </template>
                                </div>
                            </div>
                        </article>
                    </div>
                </section>
            </template>
        </section>
    </main>
</template>
