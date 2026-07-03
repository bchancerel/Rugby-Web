<script setup lang="ts">
import type { NewsResponse, NewsSourceKey } from '~/types/news'

definePageMeta({
    middleware: 'auth',
})

useHead({
    title: 'RugbyJam | Actualités',
})

type SourceFilter = NewsSourceKey | 'all'

const sourceFilters: Array<{ key: SourceFilter, label: string }> = [
    { key: 'all', label: 'Toutes' },
    { key: 'rugbyrama', label: 'Rugbyrama' },
    { key: 'rugbypass', label: 'RugbyPass' },
    { key: 'planet-rugby', label: 'Planet Rugby' },
]

const apiFetch = useApiRequest()
const selectedSource = ref<SourceFilter>('all')
const transfersOnly = ref(false)
const news = ref<NewsResponse | null>(null)
const pending = ref(false)
const loadMorePending = ref(false)
const errorMessage = ref('')
const imageErrors = ref(new Set<string>())
let newsRefreshTimer: ReturnType<typeof setInterval> | null = null

const NEWS_REFRESH_INTERVAL_MS = 10 * 60 * 1000
const NEWS_PAGE_SIZE = 24

const articles = computed(() => news.value?.items ?? [])
const sources = computed(() => news.value?.sources ?? [])
const hasArticles = computed(() => articles.value.length > 0)
const isInitialLoading = computed(() => pending.value && !news.value)
const isRefreshing = computed(() => pending.value && Boolean(news.value))
const hasMoreArticles = computed(() => Boolean(news.value?.hasMore))
const totalArticles = computed(() => news.value?.total ?? articles.value.length)
const sourceErrors = computed(() => sources.value.filter((source) => source.status === 'error'))
const availableSourcesCount = computed(() => sources.value.filter((source) => source.status === 'ok').length)
const emptyArticlesMessage = computed(() => transfersOnly.value
    ? 'Aucun article transfert disponible pour cette source.'
    : 'Aucun article disponible pour cette source.'
)

const getApiErrorMessage = (error: unknown) => {
    const apiError = error as { data?: { message?: string }, message?: string }
    return apiError.data?.message || apiError.message || 'Actualités indisponibles.'
}

const mergeArticles = (currentArticles: NewsResponse['items'], nextArticles: NewsResponse['items']) => {
    const seen = new Set(currentArticles.map((article) => article.id))
    return [
        ...currentArticles,
        ...nextArticles.filter((article) => !seen.has(article.id)),
    ]
}

const fetchNews = async ({ append = false } = {}) => {
    if (pending.value || loadMorePending.value) return

    if (append) {
        loadMorePending.value = true
    } else {
        pending.value = true
    }
    errorMessage.value = ''

    try {
        const offset = append ? articles.value.length : 0
        const data = await apiFetch<NewsResponse>('/news', {
            query: {
                limit: NEWS_PAGE_SIZE,
                offset,
                ...(selectedSource.value !== 'all' ? { source: selectedSource.value } : {}),
                ...(transfersOnly.value ? { topic: 'transfers' } : {}),
            },
        })

        news.value = append && news.value
            ? { ...data, items: mergeArticles(news.value.items, data.items) }
            : data
    } catch (error) {
        errorMessage.value = getApiErrorMessage(error)
        if (!news.value) {
            news.value = null
        }
    } finally {
        pending.value = false
        loadMorePending.value = false
    }
}

const selectSource = (source: SourceFilter) => {
    if (selectedSource.value === source) return

    selectedSource.value = source
    imageErrors.value = new Set()
    void fetchNews()
}

const toggleTransfersOnly = () => {
    transfersOnly.value = !transfersOnly.value
    imageErrors.value = new Set()
    void fetchNews()
}

const refreshNews = () => {
    imageErrors.value = new Set()
    void fetchNews()
}

const loadMoreNews = () => {
    void fetchNews({ append: true })
}

const startNewsRefresh = () => {
    if (!import.meta.client || newsRefreshTimer) return

    newsRefreshTimer = setInterval(() => {
        void fetchNews()
    }, NEWS_REFRESH_INTERVAL_MS)
}

const stopNewsRefresh = () => {
    if (!newsRefreshTimer) return

    clearInterval(newsRefreshTimer)
    newsRefreshTimer = null
}

const formatArticleDate = (value: string | null) => {
    if (!value) return 'Date inconnue'

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Date inconnue'

    return new Intl.DateTimeFormat('fr-FR', {
        weekday: 'short',
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date)
}

const formatUpdatedAt = (value: string | null | undefined) => {
    if (!value) return 'Pas encore actualise'

    const date = new Date(value)
    if (Number.isNaN(date.getTime())) return 'Pas encore actualise'

    return new Intl.DateTimeFormat('fr-FR', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
    }).format(date)
}

const markImageAsBroken = (id: string) => {
    imageErrors.value = new Set([...imageErrors.value, id])
}

const shouldShowImage = (id: string, imageUrl: string | null) =>
    Boolean(imageUrl) && !imageErrors.value.has(id)

onMounted(() => {
    void fetchNews()
    startNewsRefresh()
})

onBeforeUnmount(() => {
    stopNewsRefresh()
})
</script>

<template>
    <main class="news-page">
        <section class="news-shell" aria-labelledby="news-page-title">
            <header class="news-header">
                <div>
                    <p class="news-eyebrow">Fil info</p>
                    <h1 id="news-page-title">Actualités</h1>
                    <p>Les derniers articles rugby agreges depuis Rugbyrama, RugbyPass et Planet Rugby.</p>
                </div>

                <button type="button" :disabled="pending" @click="refreshNews">
                    {{ pending ? 'Actualisation...' : 'Actualiser' }}
                </button>
            </header>

            <section class="news-toolbar" aria-label="Filtres actualités">
                <div class="news-source-tabs" role="tablist" aria-label="Sources">
                    <button
                        v-for="filter in sourceFilters"
                        :key="filter.key"
                        type="button"
                        :class="{ active: selectedSource === filter.key }"
                        :aria-selected="selectedSource === filter.key"
                        role="tab"
                        @click="selectSource(filter.key)"
                    >
                        {{ filter.label }}
                    </button>
                </div>

                <label class="news-topic-switch">
                    <input
                        type="checkbox"
                        :checked="transfersOnly"
                        @change="toggleTransfersOnly"
                    >
                    <span class="news-topic-switch-track" aria-hidden="true">
                        <span class="news-topic-switch-thumb" />
                    </span>
                    <span>Transferts</span>
                </label>

                <p class="news-updated-at">
                    Mis à jour {{ formatUpdatedAt(news?.updatedAt) }}
                </p>
            </section>

            <div v-if="isInitialLoading" class="news-content loading-content" aria-label="Chargement des actualités">
                <div class="news-loader-wrap">
                    <AppLoader label="Chargement du fil d'articles..." />
                </div>
                <div class="news-status-grid">
                    <div v-for="item in 3" :key="item" class="news-source-status skeleton-block" />
                </div>
                <div class="news-grid">
                    <article v-for="item in 6" :key="`skeleton-${item}`" class="news-card skeleton-card" />
                </div>
            </div>

            <div v-else-if="errorMessage && !hasArticles" class="news-state error">
                <p>
                    Impossible de récupérer les actualités.
                    <span>{{ errorMessage }}</span>
                </p>
                <button type="button" @click="refreshNews">
                    Réessayer
                </button>
            </div>

            <div v-else class="news-content">
                <div v-if="errorMessage" class="news-state warning">
                    <p>
                        Les dernières actualités chargées restent affichées.
                        <span>{{ errorMessage }}</span>
                    </p>
                    <button type="button" @click="refreshNews">
                        Réessayer
                    </button>
                </div>

                <p v-if="isRefreshing" class="news-refresh-state" aria-live="polite">
                    Actualisation des articles...
                </p>

                <section v-if="sources.length" class="news-status-grid" aria-label="Etat des sources">
                    <article
                        v-for="source in sources"
                        :key="source.source"
                        class="news-source-status"
                        :class="{ error: source.status === 'error' }"
                    >
                        <span>{{ source.sourceLabel }}</span>
                        <strong v-if="source.status === 'ok'">{{ source.articlesCount }} article{{ source.articlesCount > 1 ? 's' : '' }}</strong>
                        <strong v-else>Indisponible</strong>
                    </article>
                </section>

                <div v-if="sourceErrors.length" class="news-state warning compact">
                    <p>
                        {{ sourceErrors.length }} source{{ sourceErrors.length > 1 ? 's' : '' }} indisponible{{ sourceErrors.length > 1 ? 's' : '' }}.
                        <span>{{ availableSourcesCount }} source{{ availableSourcesCount > 1 ? 's' : '' }} encore disponible{{ availableSourcesCount > 1 ? 's' : '' }}.</span>
                    </p>
                </div>

                <div v-if="!hasArticles" class="news-state empty">
                    <p>
                        {{ emptyArticlesMessage }}
                        <span>Tu peux relancer une actualisation dans quelques instants.</span>
                    </p>
                    <button type="button" @click="refreshNews">
                        Actualiser
                    </button>
                </div>

                <section v-else class="news-grid" aria-label="Articles">
                    <article v-for="article in articles" :key="article.id" class="news-card">
                        <a :href="article.url" target="_blank" rel="noopener noreferrer" class="news-card-link">
                            <span v-if="shouldShowImage(article.id, article.imageUrl)" class="news-card-media">
                                <img
                                    :src="article.imageUrl!"
                                    :alt="article.title"
                                    @error="markImageAsBroken(article.id)"
                                >
                            </span>
                            <span v-else class="news-card-media placeholder">
                                {{ article.sourceLabel.slice(0, 2).toUpperCase() }}
                            </span>

                            <span class="news-card-body">
                                <span class="news-card-meta">
                                    <span>{{ article.sourceLabel }}</span>
                                    <time :datetime="article.publishedAt || undefined">
                                        {{ formatArticleDate(article.publishedAt) }}
                                    </time>
                                </span>
                                <strong>{{ article.title }}</strong>
                                <span v-if="article.excerpt" class="news-card-excerpt">
                                    {{ article.excerpt }}
                                </span>
                            </span>
                        </a>
                    </article>
                </section>

                <div v-if="hasArticles" class="news-load-more">
                    <p>
                        {{ articles.length }} / {{ totalArticles }} article{{ totalArticles > 1 ? 's' : '' }} affiche{{ articles.length > 1 ? 's' : '' }}
                    </p>

                    <button
                        v-if="hasMoreArticles"
                        type="button"
                        :disabled="loadMorePending"
                        @click="loadMoreNews"
                    >
                        {{ loadMorePending ? 'Chargement...' : 'Charger plus' }}
                    </button>
                </div>
            </div>
        </section>
    </main>
</template>
