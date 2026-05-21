import type { SupporterBadge, SupporterBadgeKey } from '~/types/supporter'

type SupporterRewardToast = {
    id: string
    badge: SupporterBadge
}

const RECENT_BADGES_STORAGE_KEY = 'rugbyjam:supporter:recent-badges'
const TOAST_DURATION_MS = 6500

let toastCounter = 0

const readRecentBadgeKeys = (): SupporterBadgeKey[] => {
    if (!import.meta.client) return []

    try {
        const storedValue = window.sessionStorage.getItem(RECENT_BADGES_STORAGE_KEY)
        const parsedValue = storedValue ? JSON.parse(storedValue) : []

        return Array.isArray(parsedValue) ? parsedValue : []
    } catch {
        return []
    }
}

const persistRecentBadgeKeys = (badgeKeys: SupporterBadgeKey[]) => {
    if (!import.meta.client) return

    window.sessionStorage.setItem(RECENT_BADGES_STORAGE_KEY, JSON.stringify(badgeKeys))
}

export const useSupporterRewards = () => {
    const toasts = useState<SupporterRewardToast[]>('supporter:reward-toasts', () => [])
    const recentBadgeKeys = useState<SupporterBadgeKey[]>(
        'supporter:recent-badge-keys',
        () => readRecentBadgeKeys()
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

        toasts.value = [...toasts.value, { id: toastId, badge }]

        if (!recentBadgeKeys.value.includes(badge.key)) {
            recentBadgeKeys.value = [...recentBadgeKeys.value, badge.key]
            persistRecentBadgeKeys(recentBadgeKeys.value)
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

    return {
        toasts,
        recentBadgeKeys,
        dismissToast,
        notifyBadgeUnlocked,
        notifyUnlockedBadges,
        isBadgeRecentlyUnlocked,
        clearRecentBadge,
    }
}
