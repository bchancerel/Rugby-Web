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

                </article>

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
                    </dl>
                </section>
            </template>
        </section>
    </main>
</template>
