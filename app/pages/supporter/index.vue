<script setup lang="ts">
import SupporterDashboard from '~/components/supporter/SupporterDashboard.vue'

definePageMeta({
    middleware: 'auth',
})

useHead({
    title: 'RugbyJam | Dashboard supporter',
})

const {
    profile,
    pending,
    errorMessage,
    fetchSupporterProfile,
} = useSupporter()

onMounted(() => {
    void fetchSupporterProfile()
})
</script>

<template>
    <main class="supporter-page">
        <section class="supporter-shell" aria-labelledby="supporter-title">
            <div class="supporter-heading">
                <p class="supporter-eyebrow">Dashboard supporter</p>
                <h1 id="supporter-title">Mon vestiaire</h1>
            </div>

            <div v-if="pending && !profile" class="supporter-state">
                Chargement du profil supporter...
            </div>

            <div v-else-if="errorMessage" class="supporter-state error">
                {{ errorMessage }}
            </div>

            <SupporterDashboard v-else-if="profile" :profile="profile" />
        </section>
    </main>
</template>
