<script setup lang="ts">
defineProps<{
    selectedSeason: number | null
    seasonOptions: number[]
    canSelectSeason: boolean
    pending: boolean
}>()

const emit = defineEmits<{
    change: [season: number]
}>()

const updateSeason = (event: Event) => {
    const target = event.target as HTMLSelectElement
    const season = Number(target.value)

    if (Number.isInteger(season)) emit('change', season)
}
</script>

<template>
    <div class="season-filter">
        <label for="league-season-select">
            <span>Saison</span>
            <select
                id="league-season-select"
                :value="selectedSeason ?? ''"
                :disabled="!canSelectSeason || pending"
                @change="updateSeason"
            >
                <option
                    v-for="season in seasonOptions"
                    :key="season"
                    :value="season"
                >
                    {{ season }}
                </option>
            </select>
        </label>
    </div>
</template>
