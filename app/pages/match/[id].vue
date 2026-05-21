<script setup lang="ts">
import type { RugbyFixture } from '~/types/rugby'
import {
    RUGBY_PLACEHOLDER_LOGO,
    setRugbyPlaceholderLogo,
} from '~/composables/useRugbyLeagues'

definePageMeta({
    middleware: 'auth',
})

const route = useRoute()
const config = useRuntimeConfig()
const { getFixtureTeamPath } = useRugbyTeamLinks()

const fixture = ref<RugbyFixture | null>(null)
const pending = ref(false)
const errorMessage = ref('')

const matchId = computed(() => String(route.params.id ?? ''))
const apiBase = computed(() => import.meta.server ? config.apiBase : config.public.apiBase)
const hasScore = computed(() =>
    fixture.value?.score.home !== null && fixture.value?.score.away !== null
)
const statusLabel = computed(() =>
    fixture.value?.status.long ?? fixture.value?.status.short ?? (hasScore.value ? 'Termine' : 'A venir')
)
const matchTitle = computed(() => {
    const home = fixture.value?.teams.home.name ?? 'Domicile'
    const away = fixture.value?.teams.away.name ?? 'Exterieur'

    return `${home} - ${away}`
})

const getApiErrorMessage = (error: unknown) => {
    const apiError = error as { data?: { message?: string }, message?: string }
    return apiError.data?.message || apiError.message || 'Match indisponible.'
}

const formatFixtureScore = (currentFixture: RugbyFixture) => {
    if (currentFixture.score.home === null || currentFixture.score.away === null) return 'vs'
    return `${currentFixture.score.home} - ${currentFixture.score.away}`
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

const getTeamScore = (score: number | null) => score ?? '-'

const getTeamClass = (winner: boolean | null) => ({
    winner: winner === true,
    loser: winner === false,
})

const fetchFixture = async () => {
    if (!matchId.value) return

    pending.value = true
    errorMessage.value = ''

    try {
        fixture.value = await $fetch<RugbyFixture>(`/rugby/fixtures/${matchId.value}`, {
            baseURL: apiBase.value,
            credentials: 'include',
        })
    } catch (error) {
        fixture.value = null
        errorMessage.value = getApiErrorMessage(error)
    } finally {
        pending.value = false
    }
}

watch(matchId, () => {
    void fetchFixture()
}, { immediate: true })

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
                Chargement du match...
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
                                    {{ fixture.league.name ?? 'Competition' }}
                                    <span v-if="fixture.league.season"> / Saison {{ fixture.league.season }}</span>
                                </p>
                            </div>
                        </div>

                        <NuxtLink
                            v-if="fixture.league.id"
                            :to="{ path: `/leagues/${fixture.league.id}`, query: fixture.league.season ? { season: String(fixture.league.season) } : {} }"
                            class="match-detail-league-link"
                        >
                            Championnat
                        </NuxtLink>
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
                        </div>

                        <div class="match-detail-team away" :class="getTeamClass(fixture.teams.away.winner)">
                            <NuxtLink
                                v-if="getFixtureTeamPath(fixture, fixture.teams.away.id)"
                                :to="getFixtureTeamPath(fixture, fixture.teams.away.id)"
                                class="match-detail-team-link away"
                            >
                                <img
                                    :src="fixture.teams.away.logo || RUGBY_PLACEHOLDER_LOGO"
                                    :alt="fixture.teams.away.name ?? 'Equipe exterieure'"
                                    @error="setRugbyPlaceholderLogo"
                                >
                                <span>{{ fixture.teams.away.name ?? 'Equipe exterieure' }}</span>
                            </NuxtLink>
                            <template v-else>
                                <span>{{ fixture.teams.away.name ?? 'Equipe exterieure' }}</span>
                                <img
                                    :src="fixture.teams.away.logo || RUGBY_PLACEHOLDER_LOGO"
                                    :alt="fixture.teams.away.name ?? 'Equipe exterieure'"
                                    @error="setRugbyPlaceholderLogo"
                                >
                            </template>
                            <small>Exterieur</small>
                        </div>
                    </section>

                    <nav class="match-detail-tabs" aria-label="Sections du match">
                        <a href="#match-detail-sheet" class="active">Feuille de match</a>
                        <a href="#match-detail-info-title">Informations</a>
                    </nav>
                </article>

                <section id="match-detail-sheet" class="match-page-section match-detail-sheet" aria-labelledby="match-detail-sheet-title">
                    <div class="match-page-section-heading">
                        <div>
                            <p class="match-page-eyebrow">Resume</p>
                            <h2 id="match-detail-sheet-title">Feuille de match</h2>
                        </div>
                    </div>

                    <div class="match-detail-sheet-card">
                        <div>
                            <span>{{ fixture.teams.home.name ?? 'Domicile' }}</span>
                            <strong>{{ getTeamScore(fixture.score.home) }}</strong>
                        </div>
                        <p>{{ hasScore ? 'Mi-temps et evenements disponibles prochainement.' : `Match programme a ${formatFixtureTime(fixture.date)}.` }}</p>
                        <div>
                            <strong>{{ getTeamScore(fixture.score.away) }}</strong>
                            <span>{{ fixture.teams.away.name ?? 'Exterieur' }}</span>
                        </div>
                    </div>
                </section>

                <section class="match-page-section match-detail-info" aria-labelledby="match-detail-info-title">
                    <div class="match-page-section-heading">
                        <div>
                            <p class="match-page-eyebrow">Details</p>
                            <h2 id="match-detail-info-title">Informations</h2>
                        </div>
                    </div>

                    <dl class="match-detail-info-grid">
                        <div>
                            <dt>Journee</dt>
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
                        <div>
                            <dt>Identifiant</dt>
                            <dd>{{ fixture.id ?? matchId }}</dd>
                        </div>
                    </dl>
                </section>
            </template>
        </section>
    </main>
</template>
