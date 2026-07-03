<script setup lang="ts">
import FavoriteButton from '~/components/favorites/FavoriteButton.vue'
import type { RugbyLeague } from '~/types/rugby'
import {
    RUGBY_PLACEHOLDER_LOGO,
    getRugbyLeagueKey,
    getRugbyLeaguePath,
    getRugbyLeagueSeasonLabel,
    setRugbyPlaceholderLogo,
    useRugbyLeagueCatalog,
} from '~/composables/useRugbyLeagues'

definePageMeta({
    middleware: 'auth',
})

useHead({
    title: 'RugbyJam | Compétitions',
})

const { data: leagues, error, pending, refresh } = await useApiFetch<RugbyLeague[]>('/rugby/leagues', {
    default: () => [],
})

const searchQuery = ref('')
const selectedCountry = ref('')
const selectedType = ref('')
const currentSeasonOnly = ref(false)

const {
    totalLeagues,
    totalCountries,
    countryOptions,
    typeOptions,
    filteredLeagues,
    groupedLeaguesByCountry,
    majorLeagues,
    resetFilters,
} = useRugbyLeagueCatalog(leagues, {
    searchQuery,
    selectedCountry,
    selectedType,
    currentSeasonOnly,
})

const isInitialLoading = computed(() => pending.value && leagues.value.length === 0)
const isRefreshing = computed(() => pending.value && leagues.value.length > 0)
const hasNoLeagues = computed(() => !pending.value && leagues.value.length === 0)

const refreshLeagues = () => {
    void refresh()
}

onMounted(() => {
    refreshLeagues()
    void useFavorites().ensureFavorites()
})
</script>

<template>
    <main class="leagues-page">
        <section class="panel">
            <div class="heading">
                <div>
                    <p class="eyebrow">RugbyJam</p>
                    <h1>Compétitions</h1>
                </div>

                <button type="button" :disabled="pending" @click="refreshLeagues">
                    {{ pending ? 'Actualisation...' : 'Actualiser' }}
                </button>
            </div>

            <div v-if="isInitialLoading" class="content loading-content" aria-label="Chargement des compétitions">
                <div class="summary-grid">
                    <div v-for="item in 3" :key="item" class="skeleton-block" />
                </div>
                <div class="skeleton-filter" />
                <div class="featured-grid">
                    <div v-for="item in 10" :key="item" class="featured-card skeleton-card" />
                </div>
                <div class="country-list">
                    <div v-for="item in 3" :key="`country-${item}`" class="country-group skeleton-country" />
                </div>
            </div>

            <div v-else-if="error && !leagues.length" class="state error">
                <p>
                    Impossible de récupérer les compétitions.
                    <span>{{ error.message }}</span>
                </p>
                <button type="button" @click="refreshLeagues">
                    Réessayer
                </button>
            </div>

            <div v-else-if="hasNoLeagues" class="state empty-api-state">
                <p>
                    Aucune compétition n’est disponible pour le moment.
                    <span>Tu peux relancer une actualisation si l’API vient d'être mise à jour.</span>
                </p>
                <button type="button" @click="refreshLeagues">
                    Actualiser
                </button>
            </div>

            <div v-else class="content">
                <div v-if="error" class="state warning-state">
                    <p>
                        Les dernières compétitions chargées restent affichées.
                        <span>{{ error.message }}</span>
                    </p>
                    <button type="button" @click="refreshLeagues">
                        Réessayer
                    </button>
                </div>

                <p v-if="isRefreshing" class="refresh-state" aria-live="polite">
                    Actualisation des compétitions...
                </p>

                <div class="summary-grid" aria-label="Résumé des compétitions">
                    <div>
                        <span class="summary-label">Compétitions</span>
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

                <section class="filters" aria-label="Filtres des compétitions">
                    <label class="search-field">
                        <span>Recherche</span>
                        <input
                            v-model="searchQuery"
                            type="search"
                            placeholder="Nom de compétition ou pays"
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
                        <input
                            v-model="currentSeasonOnly"
                            type="checkbox"
                            class="toggle-input"
                            role="switch"
                        >
                        <span class="toggle-switch" aria-hidden="true">
                            <span class="toggle-knob" />
                        </span>
                        <span class="toggle-label">Saison actuelle</span>
                    </label>

                    <button type="button" class="secondary-button" @click="resetFilters">
                        Reinitialiser
                    </button>
                </section>

                <section class="featured-section" aria-labelledby="featured-title">
                    <div class="section-heading">
                        <p class="eyebrow">Sélection</p>
                        <h2 id="featured-title">Compétitions majeures</h2>
                    </div>

                    <div class="featured-grid">
                        <article
                            v-for="league in majorLeagues"
                            :key="getRugbyLeagueKey(league, 'major-league')"
                            class="featured-card"
                        >
                            <NuxtLink :to="getRugbyLeaguePath(league)" class="league-card-link">
                                <img
                                    :src="league.logo || RUGBY_PLACEHOLDER_LOGO"
                                    :alt="league.name ?? 'Competition'"
                                    class="featured-logo"
                                    @error="setRugbyPlaceholderLogo"
                                >
                                <span class="featured-name">{{ league.name ?? 'Compétition sans nom' }}</span>
                                <span class="featured-meta">
                                    {{ [league.country.name, league.type].filter(Boolean).join(' / ') || 'Compétition majeure' }}
                                </span>
                            </NuxtLink>

                            <FavoriteButton
                                class="league-card-favorite"
                                entity-type="competition"
                                :entity-id="league.id"
                                :entity-name="league.name"
                                compact
                            />
                        </article>
                    </div>
                </section>

                <section class="all-section" aria-labelledby="all-title">
                    <div class="section-heading">
                        <p class="eyebrow">Catalogue</p>
                        <h2 id="all-title">Toutes les compétitions</h2>
                    </div>

                    <div v-if="filteredLeagues.length === 0" class="empty-state">
                        <p>
                            Aucune compétition ne correspond à ces filtres.
                            <span>Essaie un autre pays, type ou terme de recherche.</span>
                        </p>
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
                                        @error="setRugbyPlaceholderLogo"
                                    >
                                    <span v-else class="country-placeholder">{{ group.countryCode ?? '--' }}</span>
                                    <h3>{{ group.countryName }}</h3>
                                </div>
                                <span class="country-count">{{ group.leagues.length }}</span>
                            </header>

                            <div class="league-grid">
                                <article
                                    v-for="league in group.leagues"
                                    :key="getRugbyLeagueKey(league, `${group.countryName}-league`)"
                                    class="league-card"
                                >
                                    <NuxtLink :to="getRugbyLeaguePath(league)" class="league-card-link">
                                        <img
                                            :src="league.logo || RUGBY_PLACEHOLDER_LOGO"
                                            :alt="league.name ?? 'Competition'"
                                            class="league-logo"
                                            @error="setRugbyPlaceholderLogo"
                                        >
                                        <span class="league-name">{{ league.name ?? 'Compétition sans nom' }}</span>
                                        <span class="league-meta">
                                            {{ [league.type, getRugbyLeagueSeasonLabel(league) ? `Saison ${getRugbyLeagueSeasonLabel(league)}` : null].filter(Boolean).join(' / ') || 'Competition' }}
                                        </span>
                                    </NuxtLink>

                                    <FavoriteButton
                                        class="league-card-favorite"
                                        entity-type="competition"
                                        :entity-id="league.id"
                                        :entity-name="league.name"
                                        compact
                                    />
                                </article>
                            </div>
                        </section>
                    </div>
                </section>
            </div>
        </section>
    </main>
</template>
