<script setup lang="ts">
import MatchLiveIndicator from '~/components/match/MatchLiveIndicator.vue'
import {
    RUGBY_PLACEHOLDER_LOGO,
    setRugbyPlaceholderLogo,
} from '~/composables/useRugbyLeagues'
import type { RugbyFavoriteMatch, RugbyFixture, RugbyLeagueOverview, RugbyMatchesHome } from '~/types/rugby'

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
const competitionLogos = ref<Record<string, string | null>>({})
const matchesPending = ref(false)
const matchesError = ref('')

const favoriteCompetitions = computed(() => favorites.value.competitions.data.slice(0, 6))
const favoriteTeams = computed(() => favorites.value.teams.data.slice(0, 6))
const teamUpcomingMatches = computed(() =>
    favoriteMatches.value
        .filter((item) => item.type === 'team' && item.nextFixture)
        .slice(0, 4)
)
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

const fetchMatchesHome = async () => {
    matchesPending.value = true
    matchesError.value = ''

    try {
        const data = await apiFetch<RugbyMatchesHome>('/rugby/matches/home', {
            cache: 'no-store',
            query: { t: String(Date.now()) },
        })
        favoriteMatches.value = data.favoriteMatches
    } catch (error) {
        favoriteMatches.value = []
        matchesError.value = getApiErrorMessage(error)
    } finally {
        matchesPending.value = false
    }
}

const fetchCompetitionLogos = async () => {
    const entries = await Promise.all(
        favorites.value.competitions.data.map(async (favorite) => {
            try {
                const overview = await apiFetch<RugbyLeagueOverview>(`/rugby/leagues/${favorite.entityId}/overview`)
                return [favorite.entityId, overview.league.logo] as const
            } catch {
                return [favorite.entityId, null] as const
            }
        })
    )

    competitionLogos.value = Object.fromEntries(entries)
}

onMounted(async () => {
    await fetchFavorites().catch(() => undefined)
    await Promise.all([fetchMatchesHome(), fetchCompetitionLogos()])
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
                                :src="competitionLogos[favorite.entityId] || RUGBY_PLACEHOLDER_LOGO"
                                :alt="favorite.entityName ?? `Championnat ${favorite.entityId}`"
                                @error="setRugbyPlaceholderLogo"
                            >
                            <span>{{ favorite.entityName ?? `Championnat ${favorite.entityId}` }}</span>
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
