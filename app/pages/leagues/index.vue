<script setup lang="ts">
import '~/assets/css/components/leagues.css'
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
    title: 'RugbyJam | Competitions',
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

                <button type="button" :disabled="pending" @click="refreshLeagues">
                    {{ pending ? 'Actualisation...' : 'Actualiser' }}
                </button>
            </div>

            <div v-if="isInitialLoading" class="content loading-content" aria-label="Chargement des competitions">
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
                    Impossible de recuperer les competitions.
                    <span>{{ error.message }}</span>
                </p>
                <button type="button" @click="refreshLeagues">
                    Reessayer
                </button>
            </div>

            <div v-else-if="hasNoLeagues" class="state empty-api-state">
                <p>
                    Aucune competition n'est disponible pour le moment.
                    <span>Tu peux relancer une actualisation si l'API vient d'etre mise a jour.</span>
                </p>
                <button type="button" @click="refreshLeagues">
                    Actualiser
                </button>
            </div>

            <div v-else class="content">
                <div v-if="error" class="state warning-state">
                    <p>
                        Les dernieres competitions chargees restent affichees.
                        <span>{{ error.message }}</span>
                    </p>
                    <button type="button" @click="refreshLeagues">
                        Reessayer
                    </button>
                </div>

                <p v-if="isRefreshing" class="refresh-state" aria-live="polite">
                    Actualisation des competitions...
                </p>

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
                            :key="getRugbyLeagueKey(league, 'major-league')"
                            :to="getRugbyLeaguePath(league)"
                            class="featured-card"
                        >
                            <img
                                :src="league.logo || RUGBY_PLACEHOLDER_LOGO"
                                :alt="league.name ?? 'Competition'"
                                class="featured-logo"
                                @error="setRugbyPlaceholderLogo"
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

                <section class="all-section" aria-labelledby="all-title">
                    <div class="section-heading">
                        <p class="eyebrow">Catalogue</p>
                        <h2 id="all-title">Toutes les competitions</h2>
                    </div>

                    <div v-if="filteredLeagues.length === 0" class="empty-state">
                        <p>
                            Aucune competition ne correspond a ces filtres.
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
                                <NuxtLink
                                    v-for="league in group.leagues"
                                    :key="getRugbyLeagueKey(league, `${group.countryName}-league`)"
                                    :to="getRugbyLeaguePath(league)"
                                    class="league-card"
                                >
                                    <img
                                        :src="league.logo || RUGBY_PLACEHOLDER_LOGO"
                                        :alt="league.name ?? 'Competition'"
                                        class="league-logo"
                                        @error="setRugbyPlaceholderLogo"
                                    >
                                    <span class="league-name">{{ league.name ?? 'Competition sans nom' }}</span>
                                    <span class="league-meta">
                                        {{ [league.type, getRugbyLeagueSeasonLabel(league) ? `Saison ${getRugbyLeagueSeasonLabel(league)}` : null].filter(Boolean).join(' / ') || 'Competition' }}
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
