<script setup lang="ts">
import FavoritesDashboard from '~/components/favorites/FavoritesDashboard.vue'
import '~/assets/css/components/favorites.css'

definePageMeta({
    middleware: 'auth',
})

useHead({
    title: 'RugbyJam | Favoris',
})
</script>

<template>
    <main class="favorites-page">
        <FavoritesDashboard />
    </main>
</template>
