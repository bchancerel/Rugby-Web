<script setup lang="ts">
import MatchLiveIndicator from '~/components/match/MatchLiveIndicator.vue'
import {
    RUGBY_PLACEHOLDER_LOGO,
    setRugbyPlaceholderLogo,
} from '~/composables/useRugbyLeagues'
import type { RugbyFavoriteMatch, RugbyFixture, RugbyLeagueOverview, RugbyMatchesHome, RugbyStanding } from '~/types/rugby'

definePageMeta({
    middleware: 'auth',
})

const {
    favorites,
    pending: favoritesPending,
    errorMessage: favoritesError,
    ensureFavorites,
    removeFavorite,
} = useFavorites()
const apiFetch = useApiRequest()
const { getFixtureMatchPath, getFixtureTeamPath } = useRugbyTeamLinks()

const favoriteMatches = ref<RugbyFavoriteMatch[]>([])
const competitionOverviews = ref<Record<string, RugbyLeagueOverview>>({})
const matchesPending = ref(false)
const competitionOverviewsPending = ref(false)
const matchesError = ref('')

const favoriteCompetitions = computed(() => favorites.value.competitions.data.slice(0, 6))
const favoriteTeams = computed(() => favorites.value.teams.data.slice(0, 6))
const favoriteTeamIds = computed(() =>
    new Set(favorites.value.teams.data.map((favorite) => favorite.entityId))
)
const allTeamUpcomingMatches = computed(() =>
    favoriteMatches.value
        .filter((item) => item.type === 'team' && item.nextFixture)
        .sort((a, b) => getFixtureTime(a.nextFixture) - getFixtureTime(b.nextFixture))
)
const teamUpcomingMatches = computed(() =>
    allTeamUpcomingMatches.value
        .slice(0, 4)
)
const displayedOverviews = computed(() =>
    favorites.value.competitions.data
        .map((favorite) => competitionOverviews.value[favorite.entityId] ?? null)
        .filter((overview): overview is RugbyLeagueOverview => Boolean(overview))
)
const hasFavorites = computed(() =>
    favorites.value.teams.total > 0 || favorites.value.competitions.total > 0
)
const dashboardDataPending = computed(() =>
    matchesPending.value || competitionOverviewsPending.value
)
const alertsPending = computed(() =>
    hasFavorites.value && dashboardDataPending.value
)
const alertItems = computed(() => {
    const alerts: Array<{ key: string, label: string, to: string | ReturnType<typeof getFixtureMatchPath> }> = []

    for (const match of allTeamUpcomingMatches.value.slice(0, 3)) {
        if (!match.nextFixture) continue

        alerts.push({
            key: `next-team-match:${match.entityId}`,
            label: `${match.label} joue ${formatFixtureAlertDate(match.nextFixture.date)}.`,
            to: getFixtureMatchPath(match.nextFixture) ?? '/match',
        })
    }

    if (!matchesPending.value && favorites.value.teams.total > 0 && teamUpcomingMatches.value.length === 0) {
        alerts.push({
            key: 'no-team-match',
            label: 'Aucun prochain match trouvé pour tes équipes favorites.',
            to: '/match',
        })
    }

    if (!competitionOverviewsPending.value && favorites.value.competitions.total > 0 && displayedOverviews.value.length === 0) {
        alerts.push({
            key: 'no-standings',
            label: 'Les classements de tes championnats favoris sont indisponibles.',
            to: '/leagues',
        })
    }

    if (favorites.value.competitions.total === 0) {
        alerts.push({
            key: 'add-competition',
            label: 'Ajoute un championnat favori pour afficher ses classements ici.',
            to: '/leagues',
        })
    }

    return alerts.slice(0, 4)
})

const getApiErrorMessage = (error: unknown) => {
    const apiError = error as { data?: { message?: string }, message?: string }
    return apiError.data?.message || apiError.message || 'Données indisponibles.'
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
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).format(kickoff)
}

const formatFixtureAlertDate = (date: string | null) => {
    if (!date) return 'bientot'

    const kickoff = new Date(date)
    if (Number.isNaN(kickoff.getTime())) return 'bientot'

    const diffMs = kickoff.getTime() - Date.now()
    const diffHours = Math.round(diffMs / (60 * 60 * 1000))

    if (diffHours >= 0 && diffHours < 24) return `dans ${Math.max(diffHours, 1)}h`
    if (diffHours >= 24 && diffHours < 48) return 'demain'

    return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'long',
        day: '2-digit',
        month: 'short',
    }).format(kickoff)
}

const getFixtureTime = (fixture: RugbyFixture | null) => {
    if (!fixture) return Number.MAX_SAFE_INTEGER
    if (fixture.timestamp !== null) return fixture.timestamp * 1000
    if (!fixture.date) return Number.MAX_SAFE_INTEGER

    const time = new Date(fixture.date).getTime()
    return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time
}

const getTeamFavoriteMatch = (teamId: string) =>
    favoriteMatches.value.find((item) => item.type === 'team' && item.entityId === teamId) ?? null

const getTeamFavoriteLogo = (teamId: string) =>
    getTeamFavoriteMatch(teamId)?.logo || RUGBY_PLACEHOLDER_LOGO

const getTeamFavoritePath = (teamId: string) => {
    const match = getTeamFavoriteMatch(teamId)
    const fixture = match?.nextFixture ?? match?.lastFixture ?? null

    if (!fixture) return `/teams/${teamId}`

    return getFixtureTeamPath(fixture, teamId) ?? `/teams/${teamId}`
}

const getOverviewPath = (overview: RugbyLeagueOverview) =>
    overview.league.id !== null ? `/leagues/${overview.league.id}` : '/leagues'

const getOverviewSeasonLabel = (overview: RugbyLeagueOverview) =>
    overview.season ? `Saison ${overview.season}` : 'Saison indisponible'

const getStandingRows = (overview: RugbyLeagueOverview): RugbyStanding[] =>
    overview.standings[0]?.rows ?? []

const isFavoriteStandingTeam = (row: RugbyStanding) =>
    row.team.id !== null && favoriteTeamIds.value.has(String(row.team.id))

const getTeamFavoriteStanding = (teamId: string) => {
    const standings = displayedOverviews.value
        .flatMap((overview) =>
            overview.standings.flatMap((group) =>
                group.rows
                    .filter((row) => String(row.team.id) === teamId)
                    .map((row) => ({ overview, row }))
            )
        )
        .sort((a, b) =>
            (b.overview.season ?? 0) - (a.overview.season ?? 0)
            || (a.row.rank ?? Number.MAX_SAFE_INTEGER) - (b.row.rank ?? Number.MAX_SAFE_INTEGER)
        )

    return standings[0] ?? null
}

const formatTeamFavoriteStanding = (teamId: string) => {
    const standing = getTeamFavoriteStanding(teamId)
    if (!standing) return 'Classement indisponible'

    const rank = standing.row.rank ? `${standing.row.rank}e` : 'Classement'
    return `${rank} / ${standing.overview.league.name ?? 'Championnat'}`
}

const fetchMatchesHome = async () => {
    matchesPending.value = true
    matchesError.value = ''

    try {
        const data = await apiFetch<RugbyMatchesHome>('/rugby/matches/home', {
            query: { includeGlobalFixtures: '0' },
        })
        favoriteMatches.value = data.favoriteMatches
    } catch (error) {
        favoriteMatches.value = []
        matchesError.value = getApiErrorMessage(error)
    } finally {
        matchesPending.value = false
    }
}

const fetchCompetitionOverviews = async () => {
    if (favoriteCompetitions.value.length === 0) {
        competitionOverviews.value = {}
        return
    }

    competitionOverviewsPending.value = true

    try {
        const entries = await Promise.all(
            favoriteCompetitions.value.map(async (favorite): Promise<[string, RugbyLeagueOverview] | null> => {
                try {
                    const overview = await apiFetch<RugbyLeagueOverview>(`/rugby/leagues/${favorite.entityId}/overview`)
                    return [favorite.entityId, overview]
                } catch {
                    return null
                }
            })
        )

        competitionOverviews.value = Object.fromEntries(
            entries.filter((entry): entry is [string, RugbyLeagueOverview] => Boolean(entry))
        )
    } finally {
        competitionOverviewsPending.value = false
    }
}

const refreshDashboardData = async () => {
    await Promise.all([fetchMatchesHome(), fetchCompetitionOverviews()])
}

const removeDashboardFavorite = async (favoriteId: string) => {
    await removeFavorite(favoriteId)
    await refreshDashboardData()
}

onMounted(async () => {
    await ensureFavorites().catch(() => undefined)
    await refreshDashboardData()
})

useHead({
    title: 'RugbyJam | Dashboard',
})
</script>

<template>
    <main class="dashboard-page">
        <section class="dashboard-shell" aria-labelledby="dashboard-title">
            <header class="dashboard-heading">
                <div>
                    <p class="dashboard-eyebrow">Accueil</p>
                    <h1 id="dashboard-title">Dashboard</h1>
                    <p>Ton raccourci vers les championnats, equipes et prochains coups d'envoi qui comptent.</p>
                </div>
            </header>

            <p v-if="favoritesError" class="dashboard-alert">{{ favoritesError }}</p>
            <p v-if="matchesError" class="dashboard-alert">{{ matchesError }}</p>

            <section class="dashboard-summary" aria-label="Résumé">
                <div class="dashboard-stat">
                    <span>Équipes favorites</span>
                    <strong>{{ favorites.teams.total }}</strong>
                </div>
                <div class="dashboard-stat">
                    <span>Championnats favoris</span>
                    <strong>{{ favorites.competitions.total }}</strong>
                </div>
                <NuxtLink to="/match" class="dashboard-stat">
                    <span>Prochains matchs</span>
                    <strong>{{ teamUpcomingMatches.length }}</strong>
                </NuxtLink>
            </section>

            <div v-if="favoritesPending && !hasFavorites" class="dashboard-state">
                <AppLoader label="Chargement du dashboard..." />
            </div>

            <div v-else-if="!hasFavorites" class="dashboard-empty">
                <h2>Prepare ton dashboard</h2>
                <p>Ajoute des championnats et des équipes en favoris pour remplir cette page automatiquement.</p>
                <NuxtLink to="/leagues" class="dashboard-primary-link">Parcourir les championnats</NuxtLink>
            </div>

            <template v-else>
                <section v-if="alertsPending || alertItems.length" class="dashboard-alert-panel" aria-labelledby="dashboard-alerts-title">
                    <div class="dashboard-section-heading">
                        <div>
                            <p class="dashboard-eyebrow">Alertes</p>
                            <h2 id="dashboard-alerts-title">A surveiller</h2>
                        </div>
                    </div>

                    <div v-if="alertsPending" class="dashboard-state compact">
                        <AppLoader label="Chargement des informations favorites..." compact />
                    </div>

                    <div v-else class="dashboard-alert-list">
                        <NuxtLink
                            v-for="alert in alertItems"
                            :key="alert.key"
                            :to="alert.to"
                            class="dashboard-alert-item"
                        >
                            <span>{{ alert.label }}</span>
                        </NuxtLink>
                    </div>
                </section>

                <section class="dashboard-section" aria-labelledby="dashboard-competitions-title">
                    <div class="dashboard-section-heading">
                        <div>
                            <p class="dashboard-eyebrow">Acces rapide</p>
                            <h2 id="dashboard-competitions-title">Championnats favoris</h2>
                        </div>
                    </div>

                    <div v-if="competitionOverviewsPending && favoriteCompetitions.length > 0" class="dashboard-state compact">
                        <AppLoader label="Chargement des championnats favoris..." compact />
                    </div>

                    <div v-if="favoriteCompetitions.length === 0" class="dashboard-state compact">
                        Aucun championnat favori.
                    </div>

                    <div v-else class="dashboard-competition-grid">
                        <article
                            v-for="favorite in favoriteCompetitions"
                            :key="favorite.id"
                            class="dashboard-favorite-card"
                        >
                            <NuxtLink
                                :to="`/leagues/${favorite.entityId}`"
                                class="dashboard-competition-card"
                            >
                                <img
                                    :src="competitionOverviews[favorite.entityId]?.league.logo || RUGBY_PLACEHOLDER_LOGO"
                                    :alt="favorite.entityName ?? `Championnat ${favorite.entityId}`"
                                    @error="setRugbyPlaceholderLogo"
                                >
                                <span>{{ favorite.entityName ?? `Championnat ${favorite.entityId}` }}</span>
                            </NuxtLink>
                            <button
                                type="button"
                                class="dashboard-favorite-remove"
                                :disabled="favoritesPending"
                                :aria-label="`Retirer ${favorite.entityName ?? `Championnat ${favorite.entityId}`} des favoris`"
                                :title="`Retirer ${favorite.entityName ?? `Championnat ${favorite.entityId}`} des favoris`"
                                @click="removeDashboardFavorite(favorite.id)"
                            >
                                x
                            </button>
                        </article>
                    </div>
                </section>

                <section class="dashboard-section" aria-labelledby="dashboard-teams-title">
                    <div class="dashboard-section-heading">
                        <div>
                            <p class="dashboard-eyebrow">Acces rapide</p>
                            <h2 id="dashboard-teams-title">Équipes favorites</h2>
                        </div>
                    </div>

                    <div v-if="favoriteTeams.length > 0 && (competitionOverviewsPending || matchesPending)" class="dashboard-state compact">
                        <AppLoader label="Chargement des informations équipes..." compact />
                    </div>

                    <div v-if="favoriteTeams.length === 0" class="dashboard-state compact">
                        Aucune équipe favorite.
                    </div>

                    <div v-else class="dashboard-competition-grid">
                        <article
                            v-for="favorite in favoriteTeams"
                            :key="favorite.id"
                            class="dashboard-favorite-card"
                        >
                            <NuxtLink
                                :to="getTeamFavoritePath(favorite.entityId)"
                                class="dashboard-competition-card"
                            >
                                <img
                                    :src="getTeamFavoriteLogo(favorite.entityId)"
                                    :alt="favorite.entityName ?? `Équipe ${favorite.entityId}`"
                                    @error="setRugbyPlaceholderLogo"
                                >
                                <span>
                                    <strong>{{ favorite.entityName ?? `Équipe ${favorite.entityId}` }}</strong>
                                    <small>{{ formatTeamFavoriteStanding(favorite.entityId) }}</small>
                                </span>
                            </NuxtLink>
                            <button
                                type="button"
                                class="dashboard-favorite-remove"
                                :disabled="favoritesPending"
                                :aria-label="`Retirer ${favorite.entityName ?? `Équipe ${favorite.entityId}`} des favoris`"
                                :title="`Retirer ${favorite.entityName ?? `Équipe ${favorite.entityId}`} des favoris`"
                                @click="removeDashboardFavorite(favorite.id)"
                            >
                                x
                            </button>
                        </article>
                    </div>
                </section>

                <section class="dashboard-section" aria-labelledby="dashboard-matches-title">
                    <div class="dashboard-section-heading">
                        <div>
                            <p class="dashboard-eyebrow">A suivre</p>
                            <h2 id="dashboard-matches-title">Prochains matchs des équipes favorites</h2>
                        </div>
                        <NuxtLink to="/match">Tous les matchs</NuxtLink>
                    </div>

                    <div v-if="matchesPending" class="dashboard-state compact">
                        <AppLoader label="Chargement des prochains matchs..." compact />
                    </div>

                    <div v-else-if="favoriteTeams.length === 0" class="dashboard-state compact">
                        Aucune équipe favorite.
                    </div>

                    <div v-else-if="teamUpcomingMatches.length === 0" class="dashboard-state compact">
                        Aucun prochain match disponible pour tes équipes favorites.
                    </div>

                    <div v-else class="dashboard-match-list">
                        <article
                            v-for="item in teamUpcomingMatches"
                            :key="item.key"
                            class="dashboard-match-card"
                        >
                            <header>
                                <img
                                    :src="item.logo || RUGBY_PLACEHOLDER_LOGO"
                                    :alt="item.label"
                                    @error="setRugbyPlaceholderLogo"
                                >
                                <div>
                                    <span>Équipe favorite</span>
                                    <h3>{{ item.label }}</h3>
                                </div>
                            </header>

                            <div v-if="item.nextFixture" class="dashboard-match-row">
                                <NuxtLink
                                    v-if="getFixtureTeamPath(item.nextFixture, item.nextFixture.teams.home.id)"
                                    :to="getFixtureTeamPath(item.nextFixture, item.nextFixture.teams.home.id)"
                                    class="dashboard-team-link"
                                >
                                    <img
                                        :src="item.nextFixture.teams.home.logo || RUGBY_PLACEHOLDER_LOGO"
                                        :alt="item.nextFixture.teams.home.name ?? 'Domicile'"
                                        @error="setRugbyPlaceholderLogo"
                                    >
                                    <span>{{ item.nextFixture.teams.home.name ?? 'Domicile' }}</span>
                                </NuxtLink>
                                <span v-else class="dashboard-team-name">
                                    <img
                                        :src="item.nextFixture.teams.home.logo || RUGBY_PLACEHOLDER_LOGO"
                                        :alt="item.nextFixture.teams.home.name ?? 'Domicile'"
                                        @error="setRugbyPlaceholderLogo"
                                    >
                                    <span>{{ item.nextFixture.teams.home.name ?? 'Domicile' }}</span>
                                </span>

                                <NuxtLink
                                    v-if="getFixtureMatchPath(item.nextFixture)"
                                    :to="getFixtureMatchPath(item.nextFixture)"
                                    class="dashboard-score"
                                >
                                    {{ formatFixtureScore(item.nextFixture) }}
                                </NuxtLink>
                                <strong v-else class="dashboard-score">{{ formatFixtureScore(item.nextFixture) }}</strong>

                                <NuxtLink
                                    v-if="getFixtureTeamPath(item.nextFixture, item.nextFixture.teams.away.id)"
                                    :to="getFixtureTeamPath(item.nextFixture, item.nextFixture.teams.away.id)"
                                    class="dashboard-team-link away"
                                >
                                    <span>{{ item.nextFixture.teams.away.name ?? 'Exterieur' }}</span>
                                    <img
                                        :src="item.nextFixture.teams.away.logo || RUGBY_PLACEHOLDER_LOGO"
                                        :alt="item.nextFixture.teams.away.name ?? 'Exterieur'"
                                        @error="setRugbyPlaceholderLogo"
                                    >
                                </NuxtLink>
                                <span v-else class="dashboard-team-name away">
                                    <span>{{ item.nextFixture.teams.away.name ?? 'Exterieur' }}</span>
                                    <img
                                        :src="item.nextFixture.teams.away.logo || RUGBY_PLACEHOLDER_LOGO"
                                        :alt="item.nextFixture.teams.away.name ?? 'Exterieur'"
                                        @error="setRugbyPlaceholderLogo"
                                    >
                                </span>
                            </div>

                            <time v-if="item.nextFixture">
                                <MatchLiveIndicator :fixture="item.nextFixture" />
                                {{ item.nextFixture.league.name ?? 'Competition' }} / {{ formatFixtureKickoff(item.nextFixture.date) }}
                            </time>
                        </article>
                    </div>
                </section>

                <section class="dashboard-section" aria-labelledby="dashboard-standings-title">
                    <div class="dashboard-section-heading">
                        <div>
                            <p class="dashboard-eyebrow">Classements</p>
                            <h2 id="dashboard-standings-title">Mini-classements favoris</h2>
                        </div>
                    </div>

                    <div v-if="competitionOverviewsPending && favoriteCompetitions.length > 0" class="dashboard-state compact">
                        <AppLoader label="Chargement des classements..." compact />
                    </div>

                    <div v-else-if="displayedOverviews.length === 0" class="dashboard-state compact">
                        Aucun classement disponible pour tes championnats favoris.
                    </div>

                    <div v-else class="dashboard-standing-grid">
                        <NuxtLink
                            v-for="overview in displayedOverviews"
                            :key="String(overview.league.id ?? overview.league.name ?? overview.season ?? 'overview')"
                            :to="getOverviewPath(overview)"
                            class="dashboard-standing-card"
                        >
                            <header>
                                <img
                                    :src="overview.league.logo || RUGBY_PLACEHOLDER_LOGO"
                                    :alt="overview.league.name ?? 'Championnat'"
                                    @error="setRugbyPlaceholderLogo"
                                >
                                <div>
                                    <h3>{{ overview.league.name ?? 'Championnat' }}</h3>
                                    <p>{{ getOverviewSeasonLabel(overview) }}</p>
                                </div>
                            </header>

                            <ol v-if="getStandingRows(overview).length" class="dashboard-standing-list">
                                <li
                                    v-for="row in getStandingRows(overview).slice(0, 5)"
                                    :key="`${overview.league.id}-${row.rank}-${row.team.id}`"
                                    :class="{ favorite: isFavoriteStandingTeam(row) }"
                                >
                                    <span>{{ row.rank ?? '-' }}</span>
                                    <strong>{{ row.team.name ?? 'Équipe' }}</strong>
                                    <em>{{ row.points ?? '-' }} pts</em>
                                </li>
                            </ol>

                            <p v-else class="dashboard-standing-empty">Classement indisponible.</p>
                        </NuxtLink>
                    </div>
                </section>

                <section class="dashboard-shortcuts" aria-label="Raccourcis">
                    <NuxtLink to="/leagues">Championnat</NuxtLink>
                    <NuxtLink to="/match">Calendrier</NuxtLink>
                    <NuxtLink to="/supporter">Supporter</NuxtLink>
                    <NuxtLink to="/user">Compte</NuxtLink>
                </section>
            </template>
        </section>
    </main>
</template>
