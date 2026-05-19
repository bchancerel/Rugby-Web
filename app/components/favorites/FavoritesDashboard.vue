<script setup lang="ts">
import {
    RUGBY_PLACEHOLDER_LOGO,
    setRugbyPlaceholderLogo,
} from '~/composables/useRugbyLeagues'
import type { Favorite } from '~/types/favorites'
import type { RugbyFixture, RugbyLeagueOverview, RugbyStanding } from '~/types/rugby'

const {
    favorites,
    pending,
    errorMessage,
    successMessage,
    fetchFavorites,
    removeFavorite,
    getFavoriteLimit,
} = useFavorites()

const insightsPending = ref(false)
const insightsError = ref('')
const competitionOverviews = ref<Record<string, RugbyLeagueOverview>>({})
const teamFixtures = ref<Record<string, RugbyFixture[]>>({})

const hasFavorites = computed(() =>
    favorites.value.teams.data.length > 0 || favorites.value.competitions.data.length > 0
)
const displayedOverviews = computed(() =>
    favorites.value.competitions.data
        .map((favorite) => competitionOverviews.value[favorite.entityId] ?? null)
        .filter((overview): overview is RugbyLeagueOverview => Boolean(overview))
)
const teamFavoriteMatches = computed(() =>
    favorites.value.teams.data.map((favorite) => {
        const fixtures = teamFixtures.value[favorite.entityId] ?? []

        return {
            favorite,
            lastFixture: getLastPlayedFixture(fixtures),
            nextFixture: getNextFixture(fixtures),
        }
    })
)
const favoriteSignature = computed(() =>
    [
        ...favorites.value.teams.data.map((favorite) => `team:${favorite.entityId}`),
        ...favorites.value.competitions.data.map((favorite) => `competition:${favorite.entityId}`),
    ].sort().join('|')
)

const getApiErrorMessage = (error: unknown) => {
    const apiError = error as { data?: { message?: string }, message?: string }
    return apiError.data?.message || apiError.message || 'Une erreur est survenue.'
}

const formatFixtureScore = (fixture: RugbyFixture) => {
    if (fixture.score.home === null || fixture.score.away === null) return 'vs'
    return `${fixture.score.home} - ${fixture.score.away}`
}

const formatFixtureKickoff = (date: string | null) => {
    if (!date) return 'Date a venir'

    const kickoff = new Date(date)
    if (Number.isNaN(kickoff.getTime())) return 'Date a venir'

    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).format(kickoff)
}

const getFixtureTime = (fixture: RugbyFixture) => {
    if (fixture.timestamp !== null) return fixture.timestamp * 1000
    if (!fixture.date) return null

    const date = new Date(fixture.date).getTime()
    return Number.isNaN(date) ? null : date
}

const hasFixtureScore = (fixture: RugbyFixture) =>
    fixture.score.home !== null && fixture.score.away !== null

const getCompetitionFavoriteName = (favorite: Favorite) =>
    favorite.entityName ?? `Championnat ${favorite.entityId}`

const getTeamFavoriteName = (favorite: Favorite) =>
    favorite.entityName ?? `Equipe ${favorite.entityId}`

const getOverviewSeasonLabel = (overview: RugbyLeagueOverview) =>
    overview.season ? `Saison ${overview.season}` : 'Saison indisponible'

const getStandingRows = (overview: RugbyLeagueOverview): RugbyStanding[] =>
    overview.standings[0]?.rows ?? []

const getOverviewKey = (overview: RugbyLeagueOverview, index: number) =>
    `overview-${overview.league.id ?? overview.league.name ?? index}`

const getOverviewPath = (overview: RugbyLeagueOverview) =>
    overview.league.id !== null ? `/leagues/${overview.league.id}` : '/leagues'

const getTeamFixtures = (favorite: Favorite, overviews: RugbyLeagueOverview[]) =>
    overviews
        .flat()
        .flatMap((overview) => overview.fixtures)
        .filter((fixture) =>
            String(fixture.teams.home.id) === favorite.entityId ||
            String(fixture.teams.away.id) === favorite.entityId
        )

const getLastPlayedFixture = (fixtures: RugbyFixture[]) => {
    const now = Date.now()

    return fixtures
        .filter((fixture) => {
            const fixtureTime = getFixtureTime(fixture)
            return fixtureTime !== null && fixtureTime <= now && hasFixtureScore(fixture)
        })
        .sort((a, b) => (getFixtureTime(b) ?? 0) - (getFixtureTime(a) ?? 0))[0] ?? null
}

const getNextFixture = (fixtures: RugbyFixture[]) => {
    const now = Date.now()

    return fixtures
        .filter((fixture) => {
            const fixtureTime = getFixtureTime(fixture)
            return fixtureTime !== null && fixtureTime > now
        })
        .sort((a, b) => (getFixtureTime(a) ?? 0) - (getFixtureTime(b) ?? 0))[0] ?? null
}

const remove = async (favoriteId: string) => {
    await removeFavorite(favoriteId)
    await refreshInsights()
}

const refreshInsights = async () => {
    insightsPending.value = true
    insightsError.value = ''

    try {
        const overviews = await Promise.all(
            favorites.value.competitions.data.map(async (favorite) => {
                const overview = await $fetch<RugbyLeagueOverview>(`/api/rugby/leagues/${favorite.entityId}/overview`, {
                    credentials: 'include',
                })

                return [favorite.entityId, overview] as const
            })
        )
        competitionOverviews.value = Object.fromEntries(overviews)
        const currentOverviews = Object.values(competitionOverviews.value)

        const fixtures = await Promise.all(
            favorites.value.teams.data.map(async (favorite) => {
                const teamMatches = getTeamFixtures(favorite, currentOverviews)
                return [favorite.entityId, teamMatches] as const
            })
        )
        teamFixtures.value = Object.fromEntries(fixtures)
    } catch (error) {
        insightsError.value = getApiErrorMessage(error)
    } finally {
        insightsPending.value = false
    }
}

watch(favoriteSignature, async (next, previous) => {
    if (next === previous) return

    await refreshInsights()
})

onMounted(async () => {
    await fetchFavorites()
    await refreshInsights()
})
</script>

<template>
    <section class="favorites-dashboard" aria-labelledby="favorites-title">
        <div class="favorites-heading">
            <div>
                <p class="favorites-eyebrow">RugbyJam</p>
                <h1 id="favorites-title">Favoris</h1>
                <p>Retrouve rapidement tes equipes, championnats, matchs et classements.</p>
            </div>
        </div>

        <p v-if="errorMessage" class="favorites-alert">{{ errorMessage }}</p>
        <p v-if="insightsError" class="favorites-alert">{{ insightsError }}</p>
        <p v-if="successMessage" class="favorites-success">{{ successMessage }}</p>

        <section class="favorites-summary" aria-labelledby="favorites-summary-title">
            <div class="favorites-section-heading">
                <h2 id="favorites-summary-title">Mes favoris</h2>
                <p>{{ favorites.teams.total }}/{{ favorites.teams.limit ?? getFavoriteLimit('team') }} equipes / {{ favorites.competitions.total }}/{{ favorites.competitions.limit ?? getFavoriteLimit('competition') }} championnats</p>
            </div>

            <p class="favorites-summary-help">
                Ajoute ou retire des favoris depuis les boutons etoile sur les pages competitions et classements.
            </p>
        </section>

        <div v-if="pending && !hasFavorites" class="favorites-empty">
            Chargement des favoris...
        </div>

        <div v-else-if="!hasFavorites" class="favorites-empty-state">
            <h2>Ajoute tes favoris</h2>
            <p>
                Tu peux suivre jusqu'a {{ getFavoriteLimit('team') }} equipes et
                {{ getFavoriteLimit('competition') }} championnats. Utilise les boutons etoile sur les pages competitions et classements pour remplir ce tableau de bord.
            </p>
        </div>

        <template v-else>
            <div class="favorites-grid">
                <section class="favorites-group" aria-labelledby="favorite-teams-title">
                    <div class="favorites-group-heading">
                        <h2 id="favorite-teams-title">Mes equipes</h2>
                        <span>{{ favorites.teams.total }}/{{ favorites.teams.limit ?? getFavoriteLimit('team') }}</span>
                    </div>

                    <div v-if="favorites.teams.data.length === 0" class="favorites-empty compact">
                        Aucune equipe favorite.
                    </div>

                    <ul v-else class="favorites-list">
                        <li v-for="favorite in favorites.teams.data" :key="favorite.id">
                            <span>{{ getTeamFavoriteName(favorite) }}</span>
                            <button type="button" class="favorites-secondary-button" :disabled="pending" @click="remove(favorite.id)">
                                Retirer
                            </button>
                        </li>
                    </ul>
                </section>

                <section class="favorites-group" aria-labelledby="favorite-competitions-title">
                    <div class="favorites-group-heading">
                        <h2 id="favorite-competitions-title">Mes championnats</h2>
                        <span>{{ favorites.competitions.total }}/{{ favorites.competitions.limit ?? getFavoriteLimit('competition') }}</span>
                    </div>

                    <div v-if="favorites.competitions.data.length === 0" class="favorites-empty compact">
                        Aucun championnat favori.
                    </div>

                    <ul v-else class="favorites-list">
                        <li v-for="favorite in favorites.competitions.data" :key="favorite.id">
                            <NuxtLink :to="`/leagues/${favorite.entityId}`">
                                {{ getCompetitionFavoriteName(favorite) }}
                            </NuxtLink>
                            <button type="button" class="favorites-secondary-button" :disabled="pending" @click="remove(favorite.id)">
                                Retirer
                            </button>
                        </li>
                    </ul>
                </section>
            </div>

            <section class="favorites-section" aria-labelledby="favorite-matches-title">
                <div class="favorites-section-heading">
                    <h2 id="favorite-matches-title">Matchs des equipes</h2>
                    <p v-if="insightsPending">Actualisation...</p>
                </div>

                <div v-if="teamFavoriteMatches.length === 0" class="favorites-empty compact">
                    Aucune equipe favorite.
                </div>

                <div v-else class="favorites-match-grid">
                    <article v-for="item in teamFavoriteMatches" :key="item.favorite.id" class="favorites-match-card">
                        <p>{{ getTeamFavoriteName(item.favorite) }}</p>

                        <div class="favorites-team-match-block">
                            <small>Dernier match</small>
                            <div v-if="item.lastFixture" class="favorites-match-row">
                                <span>{{ item.lastFixture.teams.home.name ?? 'Domicile' }}</span>
                                <strong>{{ formatFixtureScore(item.lastFixture) }}</strong>
                                <span>{{ item.lastFixture.teams.away.name ?? 'Exterieur' }}</span>
                            </div>
                            <em v-else>Dernier match indisponible.</em>
                            <small v-if="item.lastFixture">{{ formatFixtureKickoff(item.lastFixture.date) }}</small>
                        </div>

                        <div class="favorites-team-match-block">
                            <small>Prochain match</small>
                            <div v-if="item.nextFixture" class="favorites-match-row">
                                <span>{{ item.nextFixture.teams.home.name ?? 'Domicile' }}</span>
                                <strong>{{ formatFixtureScore(item.nextFixture) }}</strong>
                                <span>{{ item.nextFixture.teams.away.name ?? 'Exterieur' }}</span>
                            </div>
                            <em v-else>Prochain match indisponible.</em>
                            <small v-if="item.nextFixture">{{ formatFixtureKickoff(item.nextFixture.date) }}</small>
                        </div>
                    </article>
                </div>
            </section>

            <section class="favorites-section" aria-labelledby="favorite-standings-title">
                <div class="favorites-section-heading">
                    <h2 id="favorite-standings-title">Classements</h2>
                    <p v-if="insightsPending">Actualisation...</p>
                </div>

                <div v-if="displayedOverviews.length === 0" class="favorites-empty compact">
                    Aucun classement disponible pour tes championnats favoris.
                </div>

                <div v-else class="favorites-standings-grid">
                    <NuxtLink
                        v-for="(overview, index) in displayedOverviews"
                        :key="getOverviewKey(overview, index)"
                        :to="getOverviewPath(overview)"
                        class="favorites-standing-card"
                    >
                        <header>
                            <img :src="overview.league.logo || RUGBY_PLACEHOLDER_LOGO" :alt="overview.league.name ?? 'Championnat'" @error="setRugbyPlaceholderLogo">
                            <div>
                                <h3>{{ overview.league.name ?? 'Championnat' }}</h3>
                                <p>{{ getOverviewSeasonLabel(overview) }}</p>
                            </div>
                        </header>

                        <ol v-if="getStandingRows(overview).length" class="favorites-standing-list">
                            <li v-for="row in getStandingRows(overview).slice(0, 5)" :key="`${overview.league.id}-${row.rank}-${row.team.id}`">
                                <span>{{ row.rank ?? '-' }}</span>
                                <strong>{{ row.team.name ?? 'Equipe' }}</strong>
                                <em>{{ row.points ?? '-' }} pts</em>
                            </li>
                        </ol>

                        <p v-else class="favorites-standing-empty">Classement indisponible.</p>
                    </NuxtLink>
                </div>
            </section>
        </template>
    </section>
</template>
