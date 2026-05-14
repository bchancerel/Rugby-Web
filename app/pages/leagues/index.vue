<script setup lang="ts">
import '~/assets/css/components/leagues.css'
import type { RugbyLeague } from '~/types/rugby'

definePageMeta({
    middleware: 'auth',
})

useHead({
    title: 'RugbyJam | Competitions',
})

type CountryLeagueGroup = {
    countryName: string
    countryCode: string | null
    flag: string | null
    leagues: RugbyLeague[]
}

const placeholderLogo = '/images/competitions/placeholder.svg'

const { data: leagues, error, pending, refresh } = await useApiFetch<RugbyLeague[]>('/rugby/leagues', {
    default: () => [],
})

const searchQuery = ref('')
const selectedCountry = ref('')
const selectedType = ref('')
const currentSeasonOnly = ref(false)

const majorLeagueIds = [16, 17, 52, 54, 13, 76, 71, 69, 85, 51]

const hasCurrentSeason = (league: RugbyLeague) =>
    league.seasons.some((season) => season.current)

const getLeaguePath = (league: RugbyLeague | null) =>
    league?.id ? `/leagues/${league.id}` : '/leagues'

const getLeagueKey = (league: RugbyLeague, fallback: string) =>
    String(league.id ?? league.name ?? fallback)

const getSeasonLabel = (league: RugbyLeague) => {
    const currentSeason = league.seasons.find((season) => season.current)
    const latestSeason = [...league.seasons]
        .filter((season) => season.year)
        .sort((a, b) => (b.year ?? 0) - (a.year ?? 0))[0]

    return currentSeason?.year ?? latestSeason?.year ?? null
}

const setPlaceholderLogo = (event: Event) => {
    const image = event.target as HTMLImageElement
    if (!image.src.endsWith(placeholderLogo)) {
        image.src = placeholderLogo
    }
}

const totalLeagues = computed(() => leagues.value.length)
const totalCountries = computed(() => {
    const countries = new Set(
        leagues.value
            .map((league) => league.country.name)
            .filter((country): country is string => Boolean(country))
    )

    return countries.size
})

const countryOptions = computed(() =>
    Array.from(
        new Set(
            leagues.value
                .map((league) => league.country.name)
                .filter((country): country is string => Boolean(country))
        )
    ).sort((a, b) => a.localeCompare(b))
)

const typeOptions = computed(() =>
    Array.from(
        new Set(
            leagues.value
                .map((league) => league.type)
                .filter((type): type is string => Boolean(type))
        )
    ).sort((a, b) => a.localeCompare(b))
)

const filteredLeagues = computed(() => {
    const query = searchQuery.value.trim().toLowerCase()

    return leagues.value
        .filter((league) => {
            const matchesQuery = !query
                || league.name?.toLowerCase().includes(query)
                || league.country.name?.toLowerCase().includes(query)
            const matchesCountry = !selectedCountry.value || league.country.name === selectedCountry.value
            const matchesType = !selectedType.value || league.type === selectedType.value
            const matchesCurrentSeason = !currentSeasonOnly.value || hasCurrentSeason(league)

            return matchesQuery && matchesCountry && matchesType && matchesCurrentSeason
        })
        .sort((a, b) => (a.name ?? '').localeCompare(b.name ?? ''))
})

const groupedLeaguesByCountry = computed<CountryLeagueGroup[]>(() => {
    const groups = new Map<string, CountryLeagueGroup>()

    for (const league of filteredLeagues.value) {
        const countryName = league.country.name ?? 'Pays inconnu'
        const existingGroup = groups.get(countryName)

        if (existingGroup) {
            existingGroup.leagues.push(league)
            continue
        }

        groups.set(countryName, {
            countryName,
            countryCode: league.country.code,
            flag: league.country.flag,
            leagues: [league],
        })
    }

    return Array.from(groups.values()).sort((a, b) => a.countryName.localeCompare(b.countryName))
})

const majorLeagues = computed(() =>
    majorLeagueIds
        .map((id) => leagues.value.find((league) => league.id === id) ?? null)
        .filter((league): league is RugbyLeague => Boolean(league))
)

const resetFilters = () => {
    searchQuery.value = ''
    selectedCountry.value = ''
    selectedType.value = ''
    currentSeasonOnly.value = false
}

onMounted(() => {
    void refresh()
})
</script>

<template>
    <main class="leagues-page">
        <section class="panel">
            <div class="heading">
                <div>
                    <p class="eyebrow">RugbyJam</p>
                    <h1>Competitions</h1>
                </div>

                <button type="button" :disabled="pending" @click="refresh()">
                    {{ pending ? 'Chargement...' : 'Actualiser' }}
                </button>
            </div>

            <div v-if="pending" class="content" aria-label="Chargement des competitions">
                <div class="summary-grid">
                    <div v-for="item in 3" :key="item" class="skeleton-block" />
                </div>
                <div class="skeleton-filter" />
                <div class="featured-grid">
                    <div v-for="item in 8" :key="item" class="featured-card skeleton-card" />
                </div>
            </div>

            <div v-else-if="error" class="state error">
                <p>
                    Impossible de recuperer les competitions.
                    <span>{{ error.message }}</span>
                </p>
                <button type="button" @click="refresh()">
                    Reessayer
                </button>
            </div>

            <div v-else class="content">
                <div class="summary-grid" aria-label="Resume des competitions">
                    <div>
                        <span class="summary-label">Competitions</span>
                        <span class="summary-value">{{ totalLeagues }}</span>
                    </div>
                    <div>
                        <span class="summary-label">Pays</span>
                        <span class="summary-value">{{ totalCountries }}</span>
                    </div>
                    <div>
                        <span class="summary-label">Resultats filtres</span>
                        <span class="summary-value">{{ filteredLeagues.length }}</span>
                    </div>
                </div>

                <section class="featured-section" aria-labelledby="featured-title">
                    <div class="section-heading">
                        <p class="eyebrow">Selection</p>
                        <h2 id="featured-title">Competitions majeures</h2>
                    </div>

                    <div class="featured-grid">
                        <NuxtLink
                            v-for="league in majorLeagues"
                            :key="getLeagueKey(league, 'major-league')"
                            :to="getLeaguePath(league)"
                            class="featured-card"
                        >
                            <img
                                :src="league.logo || placeholderLogo"
                                :alt="league.name ?? 'Competition'"
                                class="featured-logo"
                                @error="setPlaceholderLogo"
                            >
                            <span class="featured-name">{{ league.name ?? 'Competition sans nom' }}</span>
                            <span class="featured-meta">
                                {{ [league.country.name, league.type].filter(Boolean).join(' / ') || 'Competition majeure' }}
                            </span>
                        </NuxtLink>
                    </div>
                </section>

                <section class="filters" aria-label="Filtres des competitions">
                    <label class="search-field">
                        <span>Recherche</span>
                        <input
                            v-model="searchQuery"
                            type="search"
                            placeholder="Nom de competition ou pays"
                        >
                    </label>

                    <label>
                        <span>Pays</span>
                        <select v-model="selectedCountry">
                            <option value="">
                                Tous les pays
                            </option>
                            <option v-for="country in countryOptions" :key="country" :value="country">
                                {{ country }}
                            </option>
                        </select>
                    </label>

                    <label>
                        <span>Type</span>
                        <select v-model="selectedType">
                            <option value="">
                                Tous les types
                            </option>
                            <option v-for="type in typeOptions" :key="type" :value="type">
                                {{ type }}
                            </option>
                        </select>
                    </label>

                    <label class="toggle-field">
                        <input v-model="currentSeasonOnly" type="checkbox">
                        <span>Saison actuelle</span>
                    </label>

                    <button type="button" class="secondary-button" @click="resetFilters">
                        Reinitialiser
                    </button>
                </section>

                <section class="all-section" aria-labelledby="all-title">
                    <div class="section-heading">
                        <p class="eyebrow">Catalogue</p>
                        <h2 id="all-title">Toutes les competitions</h2>
                    </div>

                    <div v-if="filteredLeagues.length === 0" class="empty-state">
                        <p>Aucune competition ne correspond a ces filtres.</p>
                        <button type="button" class="secondary-button" @click="resetFilters">
                            Effacer les filtres
                        </button>
                    </div>

                    <div v-else class="country-list">
                        <section
                            v-for="group in groupedLeaguesByCountry"
                            :key="group.countryName"
                            class="country-group"
                        >
                            <header class="country-heading">
                                <div class="country-title">
                                    <img
                                        v-if="group.flag"
                                        :src="group.flag"
                                        :alt="group.countryName"
                                        class="country-flag"
                                        @error="setPlaceholderLogo"
                                    >
                                    <span v-else class="country-placeholder">{{ group.countryCode ?? '--' }}</span>
                                    <h3>{{ group.countryName }}</h3>
                                </div>
                                <span class="country-count">{{ group.leagues.length }}</span>
                            </header>

                            <div class="league-grid">
                                <NuxtLink
                                    v-for="league in group.leagues"
                                    :key="getLeagueKey(league, `${group.countryName}-league`)"
                                    :to="getLeaguePath(league)"
                                    class="league-card"
                                >
                                    <img
                                        :src="league.logo || placeholderLogo"
                                        :alt="league.name ?? 'Competition'"
                                        class="league-logo"
                                        @error="setPlaceholderLogo"
                                    >
                                    <span class="league-name">{{ league.name ?? 'Competition sans nom' }}</span>
                                    <span class="league-meta">
                                        {{ [league.type, getSeasonLabel(league) ? `Saison ${getSeasonLabel(league)}` : null].filter(Boolean).join(' / ') || 'Competition' }}
                                    </span>
                                </NuxtLink>
                            </div>
                        </section>
                    </div>
                </section>
            </div>
        </section>
    </main>
</template>
