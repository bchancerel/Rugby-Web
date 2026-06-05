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
    fetchFavorites,
} = useFavorites()
const apiFetch = useApiRequest()
const { getFixtureMatchPath, getFixtureTeamPath } = useRugbyTeamLinks()

const favoriteMatches = ref<RugbyFavoriteMatch[]>([])
const competitionOverviews = ref<Record<string, RugbyLeagueOverview>>({})
const liveFixtures = ref<RugbyFixture[]>([])
const upcomingFixtures = ref<RugbyFixture[]>([])
const matchesPending = ref(false)
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
const todayFavoriteFixtures = computed(() => {
    const fixtures = [...liveFixtures.value, ...upcomingFixtures.value]
    const seen = new Set<string>()

    return fixtures
        .filter((fixture) => isFixtureToday(fixture))
        .filter((fixture) => {
            const key = getFixtureKey(fixture)
            if (seen.has(key)) return false
            seen.add(key)
            return true
        })
        .slice(0, 5)
})
const alertItems = computed(() => {
    const alerts: Array<{ key: string, label: string, to: string | ReturnType<typeof getFixtureMatchPath> }> = []

    if (liveFixtures.value.length > 0) {
        alerts.push({
            key: 'live',
            label: `${liveFixtures.value.length} match${liveFixtures.value.length > 1 ? 's' : ''} en live maintenant.`,
            to: '/match',
        })
    }

    for (const match of allTeamUpcomingMatches.value.slice(0, 3)) {
        if (!match.nextFixture) continue

        alerts.push({
            key: `next-team-match:${match.entityId}`,
            label: `${match.label} joue ${formatFixtureAlertDate(match.nextFixture.date)}.`,
            to: getFixtureMatchPath(match.nextFixture) ?? '/match',
        })
    }

    if (favorites.value.teams.total > 0 && teamUpcomingMatches.value.length === 0) {
        alerts.push({
            key: 'no-team-match',
            label: 'Aucun prochain match trouve pour tes equipes favorites.',
            to: '/favoris',
        })
    }

    if (favorites.value.competitions.total > 0 && displayedOverviews.value.length === 0) {
        alerts.push({
            key: 'no-standings',
            label: 'Les classements de tes championnats favoris sont indisponibles.',
            to: '/favoris',
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
const hasFavorites = computed(() =>
    favorites.value.teams.total > 0 || favorites.value.competitions.total > 0
)

const getApiErrorMessage = (error: unknown) => {
    const apiError = error as { data?: { message?: string }, message?: string }
    return apiError.data?.message || apiError.message || 'Donnees indisponibles.'
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

const getFixtureKey = (fixture: RugbyFixture) =>
    String(fixture.id ?? `${fixture.date}-${fixture.teams.home.id}-${fixture.teams.away.id}`)

const getFixtureTime = (fixture: RugbyFixture | null) => {
    if (!fixture) return Number.MAX_SAFE_INTEGER
    if (fixture.timestamp !== null) return fixture.timestamp * 1000
    if (!fixture.date) return Number.MAX_SAFE_INTEGER

    const time = new Date(fixture.date).getTime()
    return Number.isNaN(time) ? Number.MAX_SAFE_INTEGER : time
}

const getFixtureDay = (date: string | null) => {
    if (!date) return ''
    const parsed = new Date(date)
    if (Number.isNaN(parsed.getTime())) return ''

    return new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Paris',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
    }).format(parsed)
}

const isFixtureToday = (fixture: RugbyFixture) =>
    getFixtureDay(fixture.date) === getFixtureDay(new Date().toISOString())

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
            cache: 'no-store',
            query: { t: String(Date.now()) },
        })
        favoriteMatches.value = data.favoriteMatches
        liveFixtures.value = data.liveFixtures
        upcomingFixtures.value = data.upcomingFixtures
    } catch (error) {
        favoriteMatches.value = []
        liveFixtures.value = []
        upcomingFixtures.value = []
        matchesError.value = getApiErrorMessage(error)
    } finally {
        matchesPending.value = false
    }
}

const fetchCompetitionOverviews = async () => {
    const entries: Array<[string, RugbyLeagueOverview]> = []

    for (const favorite of favorites.value.competitions.data) {
        try {
            const overview = await apiFetch<RugbyLeagueOverview>(`/rugby/leagues/${favorite.entityId}/overview`)
            entries.push([favorite.entityId, overview])
        } catch {
            // Keep the dashboard usable if one favorite competition is temporarily unavailable.
        }
    }

    competitionOverviews.value = Object.fromEntries(entries)
}

onMounted(async () => {
    await fetchFavorites().catch(() => undefined)
    await fetchMatchesHome()
    await fetchCompetitionOverviews()
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

            <section class="dashboard-summary" aria-label="Resume">
                <NuxtLink to="/favoris" class="dashboard-stat">
                    <span>Equipes favorites</span>
                    <strong>{{ favorites.teams.total }}</strong>
                </NuxtLink>
                <NuxtLink to="/favoris" class="dashboard-stat">
                    <span>Championnats favoris</span>
                    <strong>{{ favorites.competitions.total }}</strong>
                </NuxtLink>
                <NuxtLink to="/match" class="dashboard-stat">
                    <span>Prochains matchs</span>
                    <strong>{{ teamUpcomingMatches.length }}</strong>
                </NuxtLink>
            </section>

            <div v-if="favoritesPending && !hasFavorites" class="dashboard-state">
                Chargement du dashboard...
            </div>

            <div v-else-if="!hasFavorites" class="dashboard-empty">
                <h2>Prepare ton dashboard</h2>
                <p>Ajoute des championnats et des equipes en favoris pour remplir cette page automatiquement.</p>
                <NuxtLink to="/leagues" class="dashboard-primary-link">Parcourir les championnats</NuxtLink>
            </div>

            <template v-else>
                <section v-if="alertItems.length" class="dashboard-alert-panel" aria-labelledby="dashboard-alerts-title">
                    <div class="dashboard-section-heading">
                        <div>
                            <p class="dashboard-eyebrow">Alertes</p>
                            <h2 id="dashboard-alerts-title">A surveiller</h2>
                        </div>
                    </div>

                    <div class="dashboard-alert-list">
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
                        <NuxtLink to="/favoris">Gerer</NuxtLink>
                    </div>

                    <div v-if="favoriteCompetitions.length === 0" class="dashboard-state compact">
                        Aucun championnat favori.
                    </div>

                    <div v-else class="dashboard-competition-grid">
                        <NuxtLink
                            v-for="favorite in favoriteCompetitions"
                            :key="favorite.id"
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
                    </div>
                </section>

                <section class="dashboard-section" aria-labelledby="dashboard-teams-title">
                    <div class="dashboard-section-heading">
                        <div>
                            <p class="dashboard-eyebrow">Acces rapide</p>
                            <h2 id="dashboard-teams-title">Equipes favorites</h2>
                        </div>
                        <NuxtLink to="/favoris">Gerer</NuxtLink>
                    </div>

                    <div v-if="favoriteTeams.length === 0" class="dashboard-state compact">
                        Aucune equipe favorite.
                    </div>

                    <div v-else class="dashboard-competition-grid">
                        <NuxtLink
                            v-for="favorite in favoriteTeams"
                            :key="favorite.id"
                            :to="getTeamFavoritePath(favorite.entityId)"
                            class="dashboard-competition-card"
                        >
                            <img
                                :src="getTeamFavoriteLogo(favorite.entityId)"
                                :alt="favorite.entityName ?? `Equipe ${favorite.entityId}`"
                                @error="setRugbyPlaceholderLogo"
                            >
                            <span>
                                <strong>{{ favorite.entityName ?? `Equipe ${favorite.entityId}` }}</strong>
                                <small>{{ formatTeamFavoriteStanding(favorite.entityId) }}</small>
                            </span>
                        </NuxtLink>
                    </div>
                </section>

                <section class="dashboard-section" aria-labelledby="dashboard-matches-title">
                    <div class="dashboard-section-heading">
                        <div>
                            <p class="dashboard-eyebrow">A suivre</p>
                            <h2 id="dashboard-matches-title">Prochains matchs des equipes favorites</h2>
                        </div>
                        <NuxtLink to="/match">Tous les matchs</NuxtLink>
                    </div>

                    <div v-if="matchesPending" class="dashboard-state compact">
                        Chargement des prochains matchs...
                    </div>

                    <div v-else-if="favoriteTeams.length === 0" class="dashboard-state compact">
                        Aucune equipe favorite.
                    </div>

                    <div v-else-if="teamUpcomingMatches.length === 0" class="dashboard-state compact">
                        Aucun prochain match disponible pour tes equipes favorites.
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
                                    <span>Equipe favorite</span>
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
                        <NuxtLink to="/favoris">Voir favoris</NuxtLink>
                    </div>

                    <div v-if="displayedOverviews.length === 0" class="dashboard-state compact">
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
                                    <strong>{{ row.team.name ?? 'Equipe' }}</strong>
                                    <em>{{ row.points ?? '-' }} pts</em>
                                </li>
                            </ol>

                            <p v-else class="dashboard-standing-empty">Classement indisponible.</p>
                        </NuxtLink>
                    </div>
                </section>

                <section class="dashboard-section" aria-labelledby="dashboard-today-title">
                    <div class="dashboard-section-heading">
                        <div>
                            <p class="dashboard-eyebrow">Live / aujourd'hui</p>
                            <h2 id="dashboard-today-title">Matchs du jour</h2>
                        </div>
                        <NuxtLink to="/match">Calendrier</NuxtLink>
                    </div>

                    <div v-if="matchesPending" class="dashboard-state compact">
                        Chargement des matchs du jour...
                    </div>

                    <div v-else-if="todayFavoriteFixtures.length === 0" class="dashboard-state compact">
                        Aucun match live ou coup d'envoi favori aujourd'hui.
                    </div>

                    <div v-else class="dashboard-today-list">
                        <article
                            v-for="fixture in todayFavoriteFixtures"
                            :key="getFixtureKey(fixture)"
                            class="dashboard-today-card"
                        >
                            <p>
                                <MatchLiveIndicator :fixture="fixture" />
                                {{ fixture.league.name ?? 'Competition' }} / {{ formatFixtureKickoff(fixture.date) }}
                            </p>

                            <div class="dashboard-match-row">
                                <NuxtLink
                                    v-if="getFixtureTeamPath(fixture, fixture.teams.home.id)"
                                    :to="getFixtureTeamPath(fixture, fixture.teams.home.id)"
                                    class="dashboard-team-link"
                                >
                                    <img
                                        :src="fixture.teams.home.logo || RUGBY_PLACEHOLDER_LOGO"
                                        :alt="fixture.teams.home.name ?? 'Domicile'"
                                        @error="setRugbyPlaceholderLogo"
                                    >
                                    <span>{{ fixture.teams.home.name ?? 'Domicile' }}</span>
                                </NuxtLink>
                                <span v-else class="dashboard-team-name">
                                    <img
                                        :src="fixture.teams.home.logo || RUGBY_PLACEHOLDER_LOGO"
                                        :alt="fixture.teams.home.name ?? 'Domicile'"
                                        @error="setRugbyPlaceholderLogo"
                                    >
                                    <span>{{ fixture.teams.home.name ?? 'Domicile' }}</span>
                                </span>

                                <NuxtLink
                                    v-if="getFixtureMatchPath(fixture)"
                                    :to="getFixtureMatchPath(fixture)"
                                    class="dashboard-score"
                                >
                                    {{ formatFixtureScore(fixture) }}
                                </NuxtLink>
                                <strong v-else class="dashboard-score">{{ formatFixtureScore(fixture) }}</strong>

                                <NuxtLink
                                    v-if="getFixtureTeamPath(fixture, fixture.teams.away.id)"
                                    :to="getFixtureTeamPath(fixture, fixture.teams.away.id)"
                                    class="dashboard-team-link away"
                                >
                                    <span>{{ fixture.teams.away.name ?? 'Exterieur' }}</span>
                                    <img
                                        :src="fixture.teams.away.logo || RUGBY_PLACEHOLDER_LOGO"
                                        :alt="fixture.teams.away.name ?? 'Exterieur'"
                                        @error="setRugbyPlaceholderLogo"
                                    >
                                </NuxtLink>
                                <span v-else class="dashboard-team-name away">
                                    <span>{{ fixture.teams.away.name ?? 'Exterieur' }}</span>
                                    <img
                                        :src="fixture.teams.away.logo || RUGBY_PLACEHOLDER_LOGO"
                                        :alt="fixture.teams.away.name ?? 'Exterieur'"
                                        @error="setRugbyPlaceholderLogo"
                                    >
                                </span>
                            </div>
                        </article>
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
