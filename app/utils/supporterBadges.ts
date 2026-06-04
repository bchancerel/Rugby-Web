import type { SupporterBadgeKey } from '~/types/supporter'

const supporterBadgeImageSources: Record<SupporterBadgeKey, string> = {
    FIRST_FAVORITE: '/images/badges/badge_1.png',
    CALENDAR_SUBSCRIBER: '/images/badges/badge_2.png',
    MATCH_DAY: '/images/badges/badge_3.png',
    FINISHER: '/images/badges/badge_4.png',
    LOYAL_SUPPORTER: '/images/badges/badge_5.png',
    EXPLORER: '/images/badges/badge_6.png',
    DERBY_HUNTER: '/images/badges/badge_7.png',
    LIVE_REGULAR: '/images/badges/badge_8.png',
    MATCH_ARCHIVIST: '/images/badges/badge_9.png',
    TEAM_SCOUT: '/images/badges/badge_10.png',
    COMPETITION_TOUR: '/images/badges/badge_11.png',
    SUPER_FAVORITE: '/images/badges/badge_12.png',
}

export const getSupporterBadgeImageSrc = (badgeKey: SupporterBadgeKey) =>
    supporterBadgeImageSources[badgeKey]
