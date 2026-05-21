import type {
    CreateSupporterEventPayload,
    SupporterBadgeKey,
    SupporterEvent,
    SupporterProfile,
} from '~/types/supporter'

type ApiError = {
    data?: {
        message?: string
        errors?: Array<{ message?: string }>
    }
    message?: string
}

let supporterRequest: Promise<SupporterProfile> | null = null

const getErrorMessage = (error: unknown) => {
    const apiError = error as ApiError

    return (
        apiError.data?.message ||
        apiError.data?.errors?.[0]?.message ||
        apiError.message ||
        'Une erreur est survenue.'
    )
}

export const useSupporter = () => {
    const profile = useState<SupporterProfile | null>('supporter:profile', () => null)
    const pending = useState<boolean>('supporter:pending', () => false)
    const initialized = useState<boolean>('supporter:initialized', () => false)
    const errorMessage = useState<string>('supporter:error', () => '')

    const fetchSupporterProfile = async () => {
        if (supporterRequest) return await supporterRequest

        pending.value = true
        errorMessage.value = ''

        try {
            supporterRequest = $fetch<SupporterProfile>('/api/supporter/me', {
                credentials: 'include',
            })

            profile.value = await supporterRequest
            initialized.value = true
            return profile.value
        } catch (error) {
            errorMessage.value = getErrorMessage(error)
            throw new Error(errorMessage.value)
        } finally {
            supporterRequest = null
            pending.value = false
        }
    }

    const ensureSupporterProfile = async () => {
        if (initialized.value && profile.value) return profile.value

        return await fetchSupporterProfile()
    }

    const recordSupporterEvent = async (payload: CreateSupporterEventPayload) => {
        errorMessage.value = ''
        const previousProfile = profile.value ?? await ensureSupporterProfile().catch(() => null)
        const previousBadgeKeys = new Set<SupporterBadgeKey>(
            previousProfile?.badges
                .filter((badge) => badge.unlocked)
                .map((badge) => badge.key) ?? []
        )

        try {
            const event = await $fetch<SupporterEvent>('/api/supporter/events', {
                method: 'POST',
                body: payload,
                credentials: 'include',
            })

            const nextProfile = await fetchSupporterProfile()

            const unlockedBadges = nextProfile.badges.filter(
                (badge) => badge.unlocked && !previousBadgeKeys.has(badge.key)
            )

            if (unlockedBadges.length) {
                useSupporterRewards().notifyUnlockedBadges(unlockedBadges)
            }

            return event
        } catch (error) {
            errorMessage.value = getErrorMessage(error)
            throw new Error(errorMessage.value)
        }
    }

    const unlockedBadges = computed(() =>
        profile.value?.badges.filter((badge) => badge.unlocked) ?? []
    )

    const lockedBadges = computed(() =>
        profile.value?.badges.filter((badge) => !badge.unlocked) ?? []
    )

    return {
        profile,
        pending,
        initialized,
        errorMessage,
        unlockedBadges,
        lockedBadges,
        fetchSupporterProfile,
        ensureSupporterProfile,
        recordSupporterEvent,
    }
}
