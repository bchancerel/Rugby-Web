<script setup lang="ts">
import type { RugbyFavoriteMatch, RugbyFixture, RugbyMatchesHome } from '~/types/rugby'
import {
    RUGBY_PLACEHOLDER_LOGO,
    setRugbyPlaceholderLogo,
} from '~/composables/useRugbyLeagues'

definePageMeta({
    middleware: 'auth',
})

const config = useRuntimeConfig()
const { getFixtureTeamPath } = useRugbyTeamLinks()

const favoriteMatches = ref<RugbyFavoriteMatch[]>([])
const favoriteMatchesPending = ref(false)
const favoriteMatchesError = ref('')
const upcomingFixtures = ref<RugbyFixture[]>([])
const upcomingFixturesPending = ref(false)
const upcomingFixturesError = ref('')

const apiBase = computed(() => import.meta.server ? config.apiBase : config.public.apiBase)

const getApiErrorMessage = (error: unknown) => {
    const apiError = error as { data?: { message?: string }, message?: string }
    return apiError.data?.message || apiError.message || 'Matchs indisponibles.'
}

const fetchMatchesHome = async () => {
    favoriteMatchesPending.value = true
    upcomingFixturesPending.value = true
    favoriteMatchesError.value = ''
    upcomingFixturesError.value = ''

    try {
        const data = await $fetch<RugbyMatchesHome>('/rugby/matches/home', {
            baseURL: apiBase.value,
            credentials: 'include',
        })

        favoriteMatches.value = data.favoriteMatches
        upcomingFixtures.value = data.upcomingFixtures
    } catch (error) {
        favoriteMatches.value = []
        upcomingFixtures.value = []
        favoriteMatchesError.value = getApiErrorMessage(error)
        upcomingFixturesError.value = getApiErrorMessage(error)
    } finally {
        favoriteMatchesPending.value = false
        upcomingFixturesPending.value = false
    }
}

const hasFavoriteMatches = computed(() =>
    favoriteMatches.value.length > 0
)

const favoriteCount = computed(() =>
    favoriteMatches.value.length
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
                                <strong>{{ formatFixtureScore(item.lastFixture) }}</strong>
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
                            <time v-if="item.lastFixture">{{ formatFixtureKickoff(item.lastFixture.date) }}</time>
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
                                <strong>{{ formatFixtureScore(item.nextFixture) }}</strong>
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
                            <time v-if="item.nextFixture">{{ formatFixtureKickoff(item.nextFixture.date) }}</time>
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

                            <strong class="match-score">
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
