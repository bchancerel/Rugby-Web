import type { SupporterBadge, SupporterBadgeKey, SupporterLevel } from '~/types/supporter'

type SupporterRewardToast =
    | {
        id: string
        type: 'badge'
        badge: SupporterBadge
    }
    | {
        id: string
        type: 'level'
        level: SupporterLevel
    }

const RECENT_BADGES_STORAGE_KEY = 'rugbyjam:supporter:recent-badges'
const RECENT_LEVELS_STORAGE_KEY = 'rugbyjam:supporter:recent-levels'
const TOAST_DURATION_MS = 6500

let toastCounter = 0

const readSessionArray = <T>(storageKey: string): T[] => {
    if (!import.meta.client) return []

    try {
        const storedValue = window.sessionStorage.getItem(storageKey)
        const parsedValue = storedValue ? JSON.parse(storedValue) : []

        return Array.isArray(parsedValue) ? parsedValue : []
    } catch {
        return []
    }
}

const readRecentBadgeKeys = (): SupporterBadgeKey[] =>
    readSessionArray<SupporterBadgeKey>(RECENT_BADGES_STORAGE_KEY)

const readRecentLevelValues = (): SupporterLevel['value'][] =>
    readSessionArray<SupporterLevel['value']>(RECENT_LEVELS_STORAGE_KEY)

const persistRecentBadgeKeys = (badgeKeys: SupporterBadgeKey[]) => {
    if (!import.meta.client) return

    window.sessionStorage.setItem(RECENT_BADGES_STORAGE_KEY, JSON.stringify(badgeKeys))
}

const persistRecentLevelValues = (levelValues: SupporterLevel['value'][]) => {
    if (!import.meta.client) return

    window.sessionStorage.setItem(RECENT_LEVELS_STORAGE_KEY, JSON.stringify(levelValues))
}

export const useSupporterRewards = () => {
    const toasts = useState<SupporterRewardToast[]>('supporter:reward-toasts', () => [])
    const recentBadgeKeys = useState<SupporterBadgeKey[]>(
        'supporter:recent-badge-keys',
        () => readRecentBadgeKeys()
    )
    const recentLevelValues = useState<SupporterLevel['value'][]>(
        'supporter:recent-level-values',
        () => readRecentLevelValues()
    )

    const dismissToast = (toastId: string) => {
        toasts.value = toasts.value.filter((toast) => toast.id !== toastId)
    }

    const notifyBadgeUnlocked = (badge: SupporterBadge) => {
        const isBadgeAlreadyNotified =
            recentBadgeKeys.value.includes(badge.key) ||
            toasts.value.some((toast) => toast.badge.key === badge.key)

        if (isBadgeAlreadyNotified) return

        const toastId = `badge-${badge.key}-${Date.now()}-${toastCounter++}`

        toasts.value = [...toasts.value, { id: toastId, type: 'badge', badge }]

        if (!recentBadgeKeys.value.includes(badge.key)) {
            recentBadgeKeys.value = [...recentBadgeKeys.value, badge.key]
            persistRecentBadgeKeys(recentBadgeKeys.value)
        }

        if (import.meta.client) {
            window.setTimeout(() => dismissToast(toastId), TOAST_DURATION_MS)
        }
    }

    const notifyLevelUnlocked = (level: SupporterLevel) => {
        const isLevelAlreadyNotified =
            recentLevelValues.value.includes(level.value) ||
            toasts.value.some((toast) => toast.type === 'level' && toast.level.value === level.value)

        if (isLevelAlreadyNotified) return

        const toastId = `level-${level.value}-${Date.now()}-${toastCounter++}`

        toasts.value = [...toasts.value, { id: toastId, type: 'level', level }]

        if (!recentLevelValues.value.includes(level.value)) {
            recentLevelValues.value = [...recentLevelValues.value, level.value]
            persistRecentLevelValues(recentLevelValues.value)
        }

        if (import.meta.client) {
            window.setTimeout(() => dismissToast(toastId), TOAST_DURATION_MS)
        }
    }

    const notifyUnlockedBadges = (badges: SupporterBadge[]) => {
        badges.forEach((badge) => notifyBadgeUnlocked(badge))
    }

    const isBadgeRecentlyUnlocked = (badgeKey: SupporterBadgeKey) =>
        recentBadgeKeys.value.includes(badgeKey)

    const clearRecentBadge = (badgeKey: SupporterBadgeKey) => {
        recentBadgeKeys.value = recentBadgeKeys.value.filter((key) => key !== badgeKey)
        persistRecentBadgeKeys(recentBadgeKeys.value)
    }

    const isLevelRecentlyUnlocked = (levelValue: SupporterLevel['value']) =>
        recentLevelValues.value.includes(levelValue)

    const clearRecentLevel = (levelValue: SupporterLevel['value']) => {
        recentLevelValues.value = recentLevelValues.value.filter((value) => value !== levelValue)
        persistRecentLevelValues(recentLevelValues.value)
    }

    return {
        toasts,
        recentBadgeKeys,
        recentLevelValues,
        dismissToast,
        notifyBadgeUnlocked,
        notifyLevelUnlocked,
        notifyUnlockedBadges,
        isBadgeRecentlyUnlocked,
        clearRecentBadge,
        isLevelRecentlyUnlocked,
        clearRecentLevel,
    }
}
