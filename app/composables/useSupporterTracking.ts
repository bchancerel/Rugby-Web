import type { CreateSupporterEventPayload, PublicSupporterEventType } from '~/types/supporter'

const trackedKeys = new Set<string>()

const getTrackingKey = (payload: CreateSupporterEventPayload) =>
    [payload.type, payload.entityType ?? '', payload.entityId ?? ''].join(':')

export const useSupporterTracking = () => {
    const { recordSupporterEvent } = useSupporter()

    const trackSupporterEvent = async (payload: CreateSupporterEventPayload) => {
        if (!import.meta.client) return

        const key = getTrackingKey(payload)
        if (trackedKeys.has(key)) return

        trackedKeys.add(key)

        try {
            await recordSupporterEvent(payload)
        } catch {
            trackedKeys.delete(key)
        }
    }

    const trackEntityView = (type: PublicSupporterEventType, entityId: string | number | null | undefined) => {
        if (entityId === null || entityId === undefined || entityId === '') return

        void trackSupporterEvent({
            type,
            entityId: String(entityId),
        })
    }

    const trackDailyActive = () => {
        void trackSupporterEvent({ type: 'DAILY_ACTIVE' })
    }

    return {
        trackSupporterEvent,
        trackEntityView,
        trackDailyActive,
    }
}
