<script setup lang="ts">
import FavoriteButton from '~/components/favorites/FavoriteButton.vue'
import type { RugbyStandingGroup } from '~/types/rugby'
import {
    RUGBY_PLACEHOLDER_LOGO,
    setRugbyPlaceholderLogo,
} from '~/composables/useRugbyLeagues'

const props = defineProps<{
    groups: RugbyStandingGroup[]
    isTournament: boolean
    heading: string
    leagueId: string | number | null
    season: string | number | null
}>()

const formatStandingValue = (value: number | null) => value ?? '-'

const getTeamStatisticsPath = (teamId: string | number | null) => {
    if (teamId === null || !props.leagueId || !props.season) return undefined

    return {
        path: `/teams/${teamId}`,
        query: {
            league: String(props.leagueId),
            season: String(props.season),
        },
    }
}
</script>

<template>
    <section
        class="standings-section"
        aria-labelledby="standings-title"
    >
        <div class="section-heading">
            <p id="standings-title" class="eyebrow">{{ heading }}</p>
        </div>

        <div class="pool-standings-grid">
            <article
                v-for="group in groups"
                :key="group.name ?? 'Classement'"
                class="pool-standings"
            >
                <h3 v-if="isTournament">{{ group.name ?? 'Poule' }}</h3>

                <div class="standings-table-wrapper">
                    <table class="standings-table">
                        <thead>
                            <tr>
                                <th scope="col">#</th>
                                <th scope="col">Equipe</th>
                                <th scope="col">J</th>
                                <th scope="col">G</th>
                                <th scope="col">N</th>
                                <th scope="col">P</th>
                                <th scope="col">+</th>
                                <th scope="col">-</th>
                                <th scope="col">Diff +/-</th>
                                <th scope="col">Pts</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr
                                v-for="row in group.rows"
                                :key="`${group.name}-${row.rank}-${row.team.id ?? row.team.name}`"
                            >
                                <td class="rank-cell">{{ formatStandingValue(row.rank) }}</td>
                                <td>
                                    <div class="standing-team">
                                        <NuxtLink
                                            v-if="getTeamStatisticsPath(row.team.id)"
                                            :to="getTeamStatisticsPath(row.team.id)"
                                            class="standing-team-link"
                                        >
                                            <img
                                                :src="row.team.logo || RUGBY_PLACEHOLDER_LOGO"
                                                :alt="row.team.name ?? 'Equipe'"
                                                class="standing-team-logo"
                                                @error="setRugbyPlaceholderLogo"
                                            >
                                            <span>{{ row.team.name ?? 'Equipe inconnue' }}</span>
                                        </NuxtLink>
                                        <span v-else class="standing-team-link disabled">
                                            <img
                                                :src="row.team.logo || RUGBY_PLACEHOLDER_LOGO"
                                                :alt="row.team.name ?? 'Equipe'"
                                                class="standing-team-logo"
                                                @error="setRugbyPlaceholderLogo"
                                            >
                                            <span>{{ row.team.name ?? 'Equipe inconnue' }}</span>
                                        </span>
                                        <FavoriteButton
                                            entity-type="team"
                                            :entity-id="row.team.id"
                                            :entity-name="row.team.name"
                                            compact
                                        />
                                    </div>
                                </td>
                                <td>{{ formatStandingValue(row.all.played) }}</td>
                                <td>{{ formatStandingValue(row.all.win) }}</td>
                                <td>{{ formatStandingValue(row.all.draw) }}</td>
                                <td>{{ formatStandingValue(row.all.loss) }}</td>
                                <td>{{ formatStandingValue(row.all.pointsFor) }}</td>
                                <td>{{ formatStandingValue(row.all.pointsAgainst) }}</td>
                                <td>{{ formatStandingValue(row.pointsDiff) }}</td>
                                <td class="points-cell">{{ formatStandingValue(row.points) }}</td>
                            </tr>
                        </tbody>
                    </table>
                </div>
            </article>
        </div>
    </section>
</template>
