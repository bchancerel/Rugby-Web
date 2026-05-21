<script setup lang="ts">
import type { RugbyFixture } from '~/types/rugby'

const props = defineProps<{
    fixture: RugbyFixture | null
}>()

const LIVE_STATUS_CODES = new Set(['LIVE', '1H', 'HT', '2H', 'ET', 'BT', 'P', 'INT'])
const LIVE_STATUS_LABELS = ['live', 'in play', 'first half', 'half time', 'second half', 'extra time', 'pause']

const isLive = computed(() => {
    if (!props.fixture) return false

    const shortStatus = props.fixture.status.short?.toUpperCase()
    const longStatus = props.fixture.status.long?.toLowerCase()

    if (shortStatus && LIVE_STATUS_CODES.has(shortStatus)) return true
    if (LIVE_STATUS_LABELS.some((label) => longStatus?.includes(label))) return true

    return props.fixture.status.elapsed !== null
})
</script>

<template>
    <span
        v-if="isLive"
        class="match-live-indicator"
        aria-label="Match en live"
    >
        <span aria-hidden="true" />
        Live
    </span>
</template>

<style scoped>
.match-live-indicator {
    display: inline-flex;
    width: fit-content;
    min-height: 22px;
    align-items: center;
    gap: 6px;
    padding: 3px 8px;
    border: 1px solid rgba(254, 202, 202, 0.36);
    border-radius: 999px;
    background: rgba(230, 57, 70, 0.18);
    box-shadow: 0 0 0 rgba(230, 57, 70, 0);
    color: #fecaca;
    font-size: 0.7rem;
    font-weight: 950;
    line-height: 1;
    text-transform: uppercase;
    animation: live-indicator-glow 1.8s ease-in-out infinite;
}

.match-live-indicator span {
    width: 7px;
    height: 7px;
    border-radius: 50%;
    background: var(--rj-color-live);
    box-shadow: 0 0 0 0 rgba(230, 57, 70, 0.64);
    animation: live-indicator-pulse 1.3s ease-out infinite;
}

@keyframes live-indicator-glow {
    0%,
    100% {
        box-shadow: 0 0 0 rgba(230, 57, 70, 0);
    }

    50% {
        box-shadow: 0 0 18px rgba(230, 57, 70, 0.34);
    }
}

@keyframes live-indicator-pulse {
    0% {
        box-shadow: 0 0 0 0 rgba(230, 57, 70, 0.64);
    }

    70%,
    100% {
        box-shadow: 0 0 0 8px rgba(230, 57, 70, 0);
    }
}

@media (prefers-reduced-motion: reduce) {
    .match-live-indicator,
    .match-live-indicator span {
        animation: none;
    }
}
</style>
