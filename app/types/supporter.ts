export type SupporterLevel = {
    value: number
    label: string
    currentLevelXp: number
    nextLevelXp: number | null
    nextLevelLabel: string | null
    progress: number
}

export type SupporterBadgeKey =
    | 'FIRST_FAVORITE'
    | 'CALENDAR_SUBSCRIBER'
    | 'MATCH_DAY'
    | 'FINISHER'
    | 'LOYAL_SUPPORTER'
    | 'EXPLORER'
    | 'DERBY_HUNTER'
    | 'LIVE_REGULAR'
    | 'MATCH_ARCHIVIST'
    | 'TEAM_SCOUT'
    | 'COMPETITION_TOUR'
    | 'SUPER_FAVORITE'

export type SupporterBadge = {
    key: SupporterBadgeKey
    label: string
    description: string
    xp: number
    unlocked: boolean
    unlockedAt: string | null
}

export type SupporterEventType =
    | 'FAVORITE_TEAM_ADDED'
    | 'FAVORITE_CLUB_ADDED'
    | 'FAVORITE_COMPETITION_ADDED'
    | 'MATCH_VIEWED'
    | 'LIVE_MATCH_FOLLOWED'
    | 'FINISHED_MATCH_VIEWED'
    | 'PROFILE_COMPLETED'
    | 'DAILY_ACTIVE'
    | 'TEAM_VIEWED'
    | 'COMPETITION_VIEWED'
    | 'BADGE_UNLOCKED'

export type PublicSupporterEventType =
    | 'MATCH_VIEWED'
    | 'LIVE_MATCH_FOLLOWED'
    | 'FINISHED_MATCH_VIEWED'
    | 'TEAM_VIEWED'
    | 'COMPETITION_VIEWED'
    | 'DAILY_ACTIVE'

export type SupporterEntityType =
    | 'team'
    | 'club'
    | 'competition'
    | 'match'
    | 'profile'
    | 'day'
    | 'badge'

export type SupporterEvent = {
    id: string
    userId: string
    type: SupporterEventType
    entityType: SupporterEntityType | null
    entityId: string | null
    dedupeKey: string | null
    xp: number
    metadata: Record<string, unknown> | null
    createdAt: string
}

export type SupporterProfile = {
    totalXp: number
    level: SupporterLevel
    badges: SupporterBadge[]
    recentEvents: SupporterEvent[]
}

export type CreateSupporterEventPayload = {
    type: PublicSupporterEventType
    entityType?: Exclude<SupporterEntityType, 'badge'>
    entityId?: string
    metadata?: Record<string, unknown>
}
