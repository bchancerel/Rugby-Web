import type {
    AddFavoritePayload,
    Favorite,
    FavoriteEntityType,
    FavoritesResponse,
} from '~/types/favorites'

type ApiError = {
    data?: {
        message?: string
        errors?: Array<{ message?: string }>
    }
    message?: string
}

const DEFAULT_FAVORITE_LIMIT = 3
let favoritesRequest: Promise<FavoritesResponse> | null = null

const createEmptyFavorites = (): FavoritesResponse => ({
    club: null,
    selection: null,
    teams: {
        data: [],
        total: 0,
        limit: DEFAULT_FAVORITE_LIMIT,
    },
    competitions: {
        data: [],
        total: 0,
        page: 1,
        totalPages: 0,
        limit: DEFAULT_FAVORITE_LIMIT,
    },
})

const getErrorMessage = (error: unknown) => {
    const apiError = error as ApiError

    return (
        apiError.data?.message ||
        apiError.data?.errors?.[0]?.message ||
        apiError.message ||
        'Une erreur est survenue.'
    )
}

const getCollectionKey = (entityType: FavoriteEntityType) =>
    entityType === 'team' ? 'teams' : 'competitions'

export const useFavorites = () => {
    const favorites = useState<FavoritesResponse>('favorites:data', createEmptyFavorites)
    const pending = useState<boolean>('favorites:pending', () => false)
    const initialized = useState<boolean>('favorites:initialized', () => false)
    const errorMessage = useState<string>('favorites:error', () => '')
    const successMessage = useState<string>('favorites:success', () => '')

    const fetchFavorites = async () => {
        if (favoritesRequest) return await favoritesRequest

        pending.value = true
        errorMessage.value = ''

        try {
            favoritesRequest = $fetch<FavoritesResponse>('/api/favorites', {
                credentials: 'include',
            })

            favorites.value = await favoritesRequest
            initialized.value = true
            return favorites.value
        } catch (error) {
            errorMessage.value = getErrorMessage(error)
            throw new Error(errorMessage.value)
        } finally {
            favoritesRequest = null
            pending.value = false
        }
    }

    const ensureFavorites = async () => {
        if (initialized.value) return favorites.value

        return await fetchFavorites()
    }

    const getFavoritesByType = (entityType: FavoriteEntityType) =>
        favorites.value[getCollectionKey(entityType)].data

    const getFavoriteLimit = (entityType: FavoriteEntityType) =>
        favorites.value[getCollectionKey(entityType)].limit ?? DEFAULT_FAVORITE_LIMIT

    const getFavoriteCount = (entityType: FavoriteEntityType) =>
        favorites.value[getCollectionKey(entityType)].total

    const findFavorite = (entityType: FavoriteEntityType, entityId: string | number | null | undefined) => {
        if (entityId === null || entityId === undefined || entityId === '') return null

        return getFavoritesByType(entityType).find((favorite) => favorite.entityId === String(entityId)) ?? null
    }

    const isFavorite = (entityType: FavoriteEntityType, entityId: string | number | null | undefined) =>
        Boolean(findFavorite(entityType, entityId))

    const isLimitReached = (entityType: FavoriteEntityType) =>
        getFavoriteCount(entityType) >= getFavoriteLimit(entityType)

    const addFavorite = async (payload: AddFavoritePayload) => {
        pending.value = true
        errorMessage.value = ''
        successMessage.value = ''

        try {
            const favorite = await $fetch<Favorite>('/api/favorites', {
                method: 'POST',
                body: payload,
                credentials: 'include',
            })

            await fetchFavorites()
            successMessage.value = 'Favori ajoute.'
            return favorite
        } catch (error) {
            errorMessage.value = getErrorMessage(error)
            throw new Error(errorMessage.value)
        } finally {
            pending.value = false
        }
    }

    const removeFavorite = async (favoriteId: string) => {
        pending.value = true
        errorMessage.value = ''
        successMessage.value = ''

        try {
            await $fetch(`/api/favorites/${favoriteId}`, {
                method: 'DELETE',
                credentials: 'include',
            })

            await fetchFavorites()
            successMessage.value = 'Favori retire.'
        } catch (error) {
            errorMessage.value = getErrorMessage(error)
            throw new Error(errorMessage.value)
        } finally {
            pending.value = false
        }
    }

    return {
        favorites,
        pending,
        initialized,
        errorMessage,
        successMessage,
        fetchFavorites,
        ensureFavorites,
        addFavorite,
        removeFavorite,
        getFavoritesByType,
        getFavoriteLimit,
        getFavoriteCount,
        findFavorite,
        isFavorite,
        isLimitReached,
    }
}
