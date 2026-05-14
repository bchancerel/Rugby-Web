<script setup lang="ts">
import type { RugbyLeague } from '~/types/rugby'

definePageMeta({
  middleware: 'auth',
})

const route = useRoute()
const leagueId = computed(() => String(route.params.id))

const { data: leagues, error, pending, refresh } = await useApiFetch<RugbyLeague[]>('/rugby/leagues', {
  default: () => [],
})

const league = computed(() =>
  leagues.value.find((item) => item.id !== null && String(item.id) === leagueId.value) ?? null
)

useHead(() => ({
  title: league.value?.name ? `RugbyJam | ${league.value.name}` : 'RugbyJam | Competition',
}))
</script>

<template>
  <main class="page">
    <section class="panel">
      <NuxtLink to="/leagues" class="back-link">
        Retour aux competitions
      </NuxtLink>

      <p v-if="pending" class="state">
        Chargement de la competition...
      </p>

      <div v-else-if="error" class="state error">
        <p>
          Impossible de recuperer cette competition.
          <span>{{ error.message }}</span>
        </p>
        <button type="button" @click="refresh()">
          Reessayer
        </button>
      </div>

      <div v-else-if="league" class="detail">
        <img
          v-if="league.logo"
          :src="league.logo"
          :alt="league.name ?? 'Competition'"
          class="league-logo"
        >
        <p class="eyebrow">{{ league.country.name ?? 'Competition' }}</p>
        <h1>{{ league.name }}</h1>
        <p class="detail-meta">
          {{ [league.type, league.seasons.length ? `${league.seasons.length} saisons` : null].filter(Boolean).join(' / ') }}
        </p>
      </div>

      <div v-else class="state">
        Competition introuvable.
      </div>
    </section>
  </main>
</template>

<style scoped>
.page {
  min-height: 100vh;
  padding: 48px 20px;
  background: #f6f7f9;
  color: #17202a;
}

.panel {
  display: grid;
  max-width: 860px;
  gap: 24px;
  margin: 0 auto;
  padding: 24px;
  border: 1px solid #d9dee5;
  border-radius: 8px;
  background: #ffffff;
}

.back-link {
  color: #17202a;
  font-weight: 800;
  text-decoration: none;
}

.back-link:hover {
  text-decoration: underline;
}

.state {
  display: grid;
  gap: 14px;
  justify-items: start;
  margin: 0;
  padding: 16px;
  border-radius: 6px;
  background: #eef2f6;
}

.state p {
  margin: 0;
}

.error {
  background: #fff1f0;
  color: #9f1d1d;
}

.error span {
  display: block;
  margin-top: 6px;
  color: #6f1212;
}

button {
  min-width: 112px;
  padding: 10px 14px;
  border: 1px solid #17202a;
  border-radius: 6px;
  background: #17202a;
  color: #ffffff;
  cursor: pointer;
}

.detail {
  display: grid;
  gap: 10px;
}

.league-logo {
  width: 96px;
  height: 96px;
  object-fit: contain;
}

.eyebrow {
  margin: 0;
  color: #697586;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: clamp(2rem, 4vw, 3.25rem);
  line-height: 1;
}

.detail-meta {
  margin: 0;
  color: #697586;
}
</style>
