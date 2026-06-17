export type NewsSourceKey = 'rugbyrama' | 'rugbypass' | 'planet-rugby'

export type NewsArticle = {
    id: string
    title: string
    source: NewsSourceKey
    sourceLabel: string
    url: string
    publishedAt: string | null
    excerpt: string | null
    imageUrl: string | null
}

export type NewsSourceStatus = {
    source: NewsSourceKey
    sourceLabel: string
    status: 'ok' | 'error'
    articlesCount: number
    error: string | null
}

export type NewsResponse = {
    items: NewsArticle[]
    updatedAt: string
    sources: NewsSourceStatus[]
    total: number
    limit: number
    offset: number
    hasMore: boolean
}
