<script setup lang="ts">
import type { RugbyFixture, RugbyMatchOdds, RugbyOddsBookmaker, RugbyOddsSide } from '~/types/rugby'

const props = defineProps<{
    fixture: RugbyFixture
    odds: RugbyMatchOdds | null
    pending: boolean
    errorMessage: string
    isLive: boolean
}>()

const winnerMarket = computed(() => props.odds?.markets[0] ?? null)

const formatOdd = (odd: number | null) =>
    odd === null ? '-' : new Intl.NumberFormat('fr-FR', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
    }).format(odd)

const getSideLabel = (side: RugbyOddsSide) => {
    if (side === 'home') return props.fixture.teams.home.name ?? 'Domicile'
    if (side === 'away') return props.fixture.teams.away.name ?? 'Exterieur'
    return 'Match nul'
}

const getBookmakerOdd = (bookmaker: RugbyOddsBookmaker, side: RugbyOddsSide) =>
    bookmaker.values.find((value) => value.side === side)?.odd ?? null

const hasOdds = computed(() => Boolean(props.odds && props.odds.bookmakersCount > 0 && winnerMarket.value))
const showDrawColumn = computed(() => props.odds?.averages.draw !== null)
const favoriteLabel = computed(() => {
    const favorite = props.odds?.favorite
    if (!favorite?.side || favorite.odd === null) return 'Favori indisponible'

    return favorite.teamName ?? getSideLabel(favorite.side)
})
const confidenceLabel = computed(() => {
    if (props.odds?.favorite.confidence === 'clear') return 'tendance nette'
    if (props.odds?.favorite.confidence === 'close') return 'tendance serree'
    return 'tendance incertaine'
})
</script>

<template>
    <section class="match-page-section match-odds-panel" aria-labelledby="match-odds-title">
        <div class="match-page-section-heading">
            <div>
                <p class="match-page-eyebrow">
                    {{ isLive ? 'Cotes pre-match' : 'Avant-match' }}
                </p>
                <h2 id="match-odds-title">Favori selon les cotes</h2>
            </div>
            <span v-if="hasOdds">{{ odds?.bookmakersCount }} bookmaker{{ odds?.bookmakersCount && odds.bookmakersCount > 1 ? 's' : '' }}</span>
        </div>

        <div v-if="pending" class="match-page-state">
            <AppLoader label="Chargement des cotes..." compact />
        </div>

        <div v-else-if="errorMessage" class="match-page-state error">
            {{ errorMessage }}
        </div>

        <div v-else-if="hasOdds && odds" class="match-odds-card">
            <div class="match-odds-summary">
                <div>
                    <span>{{ confidenceLabel }}</span>
                    <strong>{{ favoriteLabel }}</strong>
                </div>
                <b>{{ formatOdd(odds.favorite.odd) }}</b>
            </div>

            <div class="match-odds-averages" aria-label="Cotes moyennes">
                <div>
                    <span>{{ fixture.teams.home.name ?? 'Domicile' }}</span>
                    <strong>{{ formatOdd(odds.averages.home) }}</strong>
                </div>
                <div v-if="showDrawColumn">
                    <span>Nul</span>
                    <strong>{{ formatOdd(odds.averages.draw) }}</strong>
                </div>
                <div>
                    <span>{{ fixture.teams.away.name ?? 'Exterieur' }}</span>
                    <strong>{{ formatOdd(odds.averages.away) }}</strong>
                </div>
            </div>

            <div v-if="winnerMarket" class="match-odds-table" role="table" aria-label="Cotes par bookmaker">
                <div class="match-odds-row head" :class="{ 'has-draw': showDrawColumn }" role="row">
                    <span role="columnheader">Bookmaker</span>
                    <strong role="columnheader">Dom.</strong>
                    <strong v-if="showDrawColumn" role="columnheader">Nul</strong>
                    <strong role="columnheader">Ext.</strong>
                </div>
                <div
                    v-for="bookmaker in winnerMarket.bookmakers"
                    :key="bookmaker.id ?? bookmaker.name ?? JSON.stringify(bookmaker.values)"
                    class="match-odds-row"
                    :class="{ 'has-draw': showDrawColumn }"
                    role="row"
                >
                    <span role="cell">{{ bookmaker.name ?? 'Bookmaker' }}</span>
                    <strong role="cell">{{ formatOdd(getBookmakerOdd(bookmaker, 'home')) }}</strong>
                    <strong v-if="showDrawColumn" role="cell">{{ formatOdd(getBookmakerOdd(bookmaker, 'draw')) }}</strong>
                    <strong role="cell">{{ formatOdd(getBookmakerOdd(bookmaker, 'away')) }}</strong>
                </div>
            </div>

            <p class="match-odds-note">
                Cotes fournies a titre informatif. Elles peuvent varier selon les bookmakers.
            </p>
        </div>

        <div v-else class="match-page-state">
            Aucune cote disponible pour ce match.
        </div>
    </section>
</template>
