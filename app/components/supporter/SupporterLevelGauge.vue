<script setup lang="ts">
import type { SupporterLevel } from '~/types/supporter'

const props = defineProps<{
    level: SupporterLevel
    totalXp: number
    recentlyUnlocked?: boolean
}>()

const emit = defineEmits<{
    animationComplete: [levelValue: SupporterLevel['value']]
}>()

const animatedProgress = ref(0)
let progressFrame: number | null = null

const nextLevelLabel = computed(() => props.level.nextLevelLabel ?? 'Niveau maximum')
const nextLevelXpLabel = computed(() =>
    props.level.nextLevelXp === null ? 'Max' : `${props.level.nextLevelXp} XP`
)

const animateToCurrentProgress = () => {
    if (!import.meta.client) {
        animatedProgress.value = props.level.progress
        return
    }

    if (progressFrame !== null) {
        window.cancelAnimationFrame(progressFrame)
    }

    progressFrame = window.requestAnimationFrame(() => {
        animatedProgress.value = props.level.progress
        progressFrame = null
    })
}

onMounted(() => {
    animatedProgress.value = 0
    animateToCurrentProgress()
})

watch(
    () => props.level.progress,
    () => animateToCurrentProgress()
)

onBeforeUnmount(() => {
    if (progressFrame !== null) {
        window.cancelAnimationFrame(progressFrame)
    }
})
</script>

<template>
    <section
        class="supporter-panel supporter-level-panel"
        :class="{ 'recently-unlocked': recentlyUnlocked }"
        aria-labelledby="supporter-level-title"
        @animationend.self="emit('animationComplete', level.value)"
    >
        <div class="supporter-panel-heading">
            <div>
                <p class="supporter-eyebrow">Niveau {{ level.value }}</p>
                <h2 id="supporter-level-title">{{ level.label }}</h2>
            </div>
            <strong>{{ totalXp }} XP</strong>
        </div>

        <div class="supporter-gauge-meta">
            <span>{{ level.currentLevelXp }} XP</span>
            <span>{{ nextLevelXpLabel }}</span>
        </div>

        <div
            class="supporter-gauge"
            role="progressbar"
            :aria-valuenow="level.progress"
            aria-valuemin="0"
            aria-valuemax="100"
            aria-label="Progression supporter"
        >
            <span :style="{ width: `${animatedProgress}%` }" />
        </div>

        <p class="supporter-progress-copy">
            {{ level.progress }}% vers {{ nextLevelLabel }}
        </p>
    </section>
</template>
