export type FavoriteEntityType = 'competition' | 'team'

export type Favorite = {
    id: string
    userId: string
    entityType: FavoriteEntityType | 'club' | 'selection' | 'player'
    entityId: string
    entityName: string | null
    createdAt: string
}

export type FavoriteCollection = {
    data: Favorite[]
    total: number
    limit?: number
    page?: number
    totalPages?: number
}

export type FavoritesResponse = {
    club: Favorite | null
    selection: Favorite | null
    teams: FavoriteCollection
    competitions: FavoriteCollection
}

export type AddFavoritePayload = {
    entityType: FavoriteEntityType
    entityId: string
    entityName?: string
}
