<script setup lang="ts">
import type { FavoriteEntityType } from '~/types/favorites'

const props = defineProps<{
    entityType: FavoriteEntityType
    entityId: string | number | null | undefined
    entityName?: string | null
    compact?: boolean
}>()

const {
    pending,
    errorMessage,
    ensureFavorites,
    addFavorite,
    removeFavorite,
    findFavorite,
    getFavoriteLimit,
    isLimitReached,
} = useFavorites()

const localError = ref('')

const entityIdString = computed(() =>
    props.entityId === null || props.entityId === undefined ? '' : String(props.entityId)
)
const favorite = computed(() => findFavorite(props.entityType, entityIdString.value))
const isActive = computed(() => Boolean(favorite.value))
const limit = computed(() => getFavoriteLimit(props.entityType))
const hasMissingEntity = computed(() => !entityIdString.value)
const limitReached = computed(() => !isActive.value && isLimitReached(props.entityType))
const disabled = computed(() => pending.value || hasMissingEntity.value || limitReached.value)
const label = computed(() => {
    if (hasMissingEntity.value) return 'Favori indisponible'
    if (isActive.value) return 'Retirer des favoris'
    if (limitReached.value) return `Limite de ${limit.value} favoris atteinte`

    return 'Ajouter aux favoris'
})

const toggleFavorite = async () => {
    localError.value = ''

    if (hasMissingEntity.value || limitReached.value) return

    try {
        if (favorite.value) {
            await removeFavorite(favorite.value.id)
            return
        }

        await addFavorite({
            entityType: props.entityType,
            entityId: entityIdString.value,
            entityName: props.entityName ?? undefined,
        })
    } catch (error) {
        localError.value = error instanceof Error ? error.message : errorMessage.value
    }
}

onMounted(() => {
    void ensureFavorites()
})
</script>

<template>
    <span class="favorite-button-wrap">
        <button
            type="button"
            class="favorite-button"
            :class="{ active: isActive, compact, 'limit-reached': limitReached }"
            :disabled="disabled"
            :aria-pressed="isActive"
            :title="label"
            @click.stop="toggleFavorite"
        >
            <span class="favorite-button-icon" aria-hidden="true">
                {{ isActive ? '★' : '☆' }}
            </span>
            <span v-if="!compact" class="favorite-button-label">{{ label }}</span>
        </button>

        <span v-if="localError" class="favorite-button-error" role="status">
            {{ localError }}
        </span>
    </span>
</template>
