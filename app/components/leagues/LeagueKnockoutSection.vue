<script setup lang="ts">
import MatchLiveIndicator from '~/components/match/MatchLiveIndicator.vue'
import type { RugbyFixture } from '~/types/rugby'

type BracketRound = {
    name: string
    fixtures: RugbyFixture[]
}

const props = defineProps<{
    rounds: BracketRound[]
    variant: 'bracket' | 'playoff'
}>()

const { getFixtureMatchPath, getFixtureTeamPath } = useRugbyTeamLinks()

const formatStandingValue = (value: number | null) => value ?? '-'
const formatFixtureScore = (fixture: RugbyFixture) => {
    if (fixture.score.home === null || fixture.score.away === null) return 'vs'
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
</script>

<template>
    <section
        v-if="variant === 'bracket'"
        class="bracket-section"
        aria-labelledby="bracket-title"
    >
        <div class="section-heading">
            <p id="bracket-title" class="eyebrow">Phase finale</p>
        </div>

        <div class="bracket-rounds">
            <section
                v-for="(round, roundIndex) in props.rounds"
                :key="round.name"
                class="bracket-round"
                :class="{
                    'is-first-round': roundIndex === 0,
                    'is-last-round': roundIndex === props.rounds.length - 1,
                }"
            >
                <h3>{{ round.name }}</h3>

                <div class="bracket-match-list">
                    <article
                        v-for="fixture in round.fixtures"
                        :key="fixture.id ?? `${fixture.teams.home.name}-${fixture.teams.away.name}`"
                        class="bracket-match"
                    >
                        <p class="bracket-date">
                            <MatchLiveIndicator :fixture="fixture" />
                            {{ formatFixtureDate(fixture.date) }}
                        </p>
                        <div class="bracket-team-row">
                            <NuxtLink
                                v-if="getFixtureTeamPath(fixture, fixture.teams.home.id)"
                                :to="getFixtureTeamPath(fixture, fixture.teams.home.id)"
                                class="bracket-team-link"
                            >
                                {{ fixture.teams.home.name ?? 'Équipe domicile' }}
                            </NuxtLink>
                            <span v-else>{{ fixture.teams.home.name ?? 'Équipe domicile' }}</span>
                            <strong>{{ formatStandingValue(fixture.score.home) }}</strong>
                        </div>
                        <div class="bracket-team-row">
                            <NuxtLink
                                v-if="getFixtureTeamPath(fixture, fixture.teams.away.id)"
                                :to="getFixtureTeamPath(fixture, fixture.teams.away.id)"
                                class="bracket-team-link"
                            >
                                {{ fixture.teams.away.name ?? 'Équipe extérieure' }}
                            </NuxtLink>
                            <span v-else>{{ fixture.teams.away.name ?? 'Équipe extérieure' }}</span>
                            <strong>{{ formatStandingValue(fixture.score.away) }}</strong>
                        </div>
                        <NuxtLink
                            v-if="getFixtureMatchPath(fixture)"
                            :to="getFixtureMatchPath(fixture)"
                            class="bracket-score match-score-link"
                        >
                            {{ formatFixtureScore(fixture) }}
                        </NuxtLink>
                        <p v-else class="bracket-score">{{ formatFixtureScore(fixture) }}</p>
                    </article>
                </div>
            </section>
        </div>
    </section>

    <section
        v-else
        class="playoff-section"
        aria-labelledby="playoff-title"
    >
        <div class="section-heading">
            <p id="playoff-title" class="eyebrow">Phase finale</p>
        </div>

        <div class="playoff-round-list">
            <section
                v-for="round in props.rounds"
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
                            <p class="bracket-date">
                                <MatchLiveIndicator :fixture="fixture" />
                                {{ formatFixtureDate(fixture.date) }}
                            </p>
                            <NuxtLink
                                v-if="getFixtureMatchPath(fixture)"
                                :to="getFixtureMatchPath(fixture)"
                                class="bracket-score match-score-link"
                            >
                                {{ formatFixtureScore(fixture) }}
                            </NuxtLink>
                            <p v-else class="bracket-score">{{ formatFixtureScore(fixture) }}</p>
                        </div>

                        <div class="bracket-team-row">
                            <NuxtLink
                                v-if="getFixtureTeamPath(fixture, fixture.teams.home.id)"
                                :to="getFixtureTeamPath(fixture, fixture.teams.home.id)"
                                class="bracket-team-link"
                            >
                                {{ fixture.teams.home.name ?? 'Équipe domicile' }}
                            </NuxtLink>
                            <span v-else>{{ fixture.teams.home.name ?? 'Équipe domicile' }}</span>
                            <strong>{{ formatStandingValue(fixture.score.home) }}</strong>
                        </div>
                        <div class="bracket-team-row">
                            <NuxtLink
                                v-if="getFixtureTeamPath(fixture, fixture.teams.away.id)"
                                :to="getFixtureTeamPath(fixture, fixture.teams.away.id)"
                                class="bracket-team-link"
                            >
                                {{ fixture.teams.away.name ?? 'Équipe extérieure' }}
                            </NuxtLink>
                            <span v-else>{{ fixture.teams.away.name ?? 'Équipe extérieure' }}</span>
                            <strong>{{ formatStandingValue(fixture.score.away) }}</strong>
                        </div>
                    </article>
                </div>
            </section>
        </div>
    </section>
</template>
