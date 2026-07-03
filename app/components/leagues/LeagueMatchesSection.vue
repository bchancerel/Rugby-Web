<script setup lang="ts">
import MatchLiveIndicator from '~/components/match/MatchLiveIndicator.vue'
import type { RugbyFixture } from '~/types/rugby'
import {
    RUGBY_PLACEHOLDER_LOGO,
    setRugbyPlaceholderLogo,
} from '~/composables/useRugbyLeagues'

type MatchRound = {
    name: string
    label: string
    fixtures: RugbyFixture[]
}

defineProps<{
    selectedRound: MatchRound
    rounds: MatchRound[]
    selectedRoundIndex: number
    canGoToPrevious: boolean
    canGoToNext: boolean
    controlLabel: string
}>()

const emit = defineEmits<{
    previous: []
    next: []
    selectRound: [roundIndex: number]
}>()

const { getFixtureMatchPath, getFixtureTeamPath } = useRugbyTeamLinks()

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
const updateMatchRound = (event: Event) => {
    const target = event.target as HTMLSelectElement
    const roundIndex = Number(target.value)

    if (Number.isInteger(roundIndex)) emit('selectRound', roundIndex)
}
</script>

<template>
    <section
        class="matches-section"
        aria-labelledby="matches-title"
    >
        <div class="section-heading">
            <p id="matches-title" class="eyebrow">Matchs</p>
        </div>

        <div class="matches-round-heading">
            <h3>{{ selectedRound.label }}</h3>
            <span>{{ selectedRound.fixtures.length }} match{{ selectedRound.fixtures.length > 1 ? 's' : '' }}</span>
        </div>

        <div class="matches-round-controls">
            <button
                type="button"
                :disabled="!canGoToPrevious"
                @click="emit('previous')"
            >
                Precedent
            </button>

            <label for="matches-round-select">
                <span>{{ controlLabel }}</span>
                <select
                    id="matches-round-select"
                    :value="selectedRoundIndex"
                    @change="updateMatchRound"
                >
                    <option
                        v-for="(round, roundIndex) in rounds"
                        :key="round.name"
                        :value="roundIndex"
                    >
                        {{ round.label }}
                    </option>
                </select>
            </label>

            <button
                type="button"
                :disabled="!canGoToNext"
                @click="emit('next')"
            >
                Suivant
            </button>
        </div>

        <div class="match-list">
            <article
                v-for="fixture in selectedRound.fixtures"
                :key="fixture.id ?? `${selectedRound.name}-${fixture.teams.home.name}-${fixture.teams.away.name}`"
                class="match-card"
            >
                <p class="match-kickoff">
                    <MatchLiveIndicator :fixture="fixture" />
                    {{ formatFixtureKickoff(fixture.date) }}
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
                                :alt="fixture.teams.home.name ?? 'Équipe domicile'"
                                class="match-team-logo"
                                @error="setRugbyPlaceholderLogo"
                            >
                            <span>{{ fixture.teams.home.name ?? 'Équipe domicile' }}</span>
                        </NuxtLink>
                        <template v-else>
                            <img
                                :src="fixture.teams.home.logo || RUGBY_PLACEHOLDER_LOGO"
                                :alt="fixture.teams.home.name ?? 'Équipe domicile'"
                                class="match-team-logo"
                                @error="setRugbyPlaceholderLogo"
                            >
                            <span>{{ fixture.teams.home.name ?? 'Équipe domicile' }}</span>
                        </template>
                    </div>

                    <NuxtLink
                        v-if="getFixtureMatchPath(fixture)"
                        :to="getFixtureMatchPath(fixture)"
                        class="match-score match-score-link"
                    >
                        {{ formatFixtureScore(fixture) }}
                    </NuxtLink>
                    <strong v-else class="match-score">
                        {{ formatFixtureScore(fixture) }}
                    </strong>

                    <div class="match-team away">
                        <NuxtLink
                            v-if="getFixtureTeamPath(fixture, fixture.teams.away.id)"
                            :to="getFixtureTeamPath(fixture, fixture.teams.away.id)"
                            class="match-team-link"
                        >
                            <span>{{ fixture.teams.away.name ?? 'Équipe extérieure' }}</span>
                            <img
                                :src="fixture.teams.away.logo || RUGBY_PLACEHOLDER_LOGO"
                                :alt="fixture.teams.away.name ?? 'Équipe extérieure'"
                                class="match-team-logo"
                                @error="setRugbyPlaceholderLogo"
                            >
                        </NuxtLink>
                        <template v-else>
                            <span>{{ fixture.teams.away.name ?? 'Équipe extérieure' }}</span>
                            <img
                                :src="fixture.teams.away.logo || RUGBY_PLACEHOLDER_LOGO"
                                :alt="fixture.teams.away.name ?? 'Équipe extérieure'"
                                class="match-team-logo"
                                @error="setRugbyPlaceholderLogo"
                            >
                        </template>
                    </div>
                </div>
            </article>
        </div>
    </section>
</template>
