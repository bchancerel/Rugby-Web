<script setup lang="ts">
definePageMeta({
  middleware: 'auth',
})

type RugbyApiResponse = {
  get?: string
  parameters?: Record<string, unknown>
  errors?: unknown[]
  results?: number
  response?: unknown[]
}

const { data, error, pending, refresh } = await useApiFetch<RugbyApiResponse>('/rugby/leagues')
const { logout, isAuthenticated } = useAuth()

const handleLogout = async () => {
  await logout()
  await navigateTo('/auth/login')
}
</script>

<template>
  <main class="page">
    <section class="panel">
      <div class="heading">
        <div>
          <p class="eyebrow">Smoke test API</p>
          <h1>Rugby leagues</h1>
        </div>

        <button type="button" :disabled="pending" @click="refresh()">
          {{ pending ? 'Chargement...' : 'Relancer' }}
        </button>

        <button v-if="isAuthenticated" type="button" class="logout-button" @click="handleLogout">
          Deconnexion
        </button>
      </div>

      <p v-if="pending" class="state">Connexion a l'API RugbyJam...</p>

      <p v-else-if="error" class="state error">
        Impossible de recuperer les competitions.
        <span>{{ error.message }}</span>
      </p>

      <div v-else class="result">
        <dl>
          <div>
            <dt>Endpoint</dt>
            <dd>/api/rugby/leagues</dd>
          </div>
          <div>
            <dt>Resultats</dt>
            <dd>{{ (data as RugbyApiResponse)?.results ?? (data as RugbyApiResponse)?.response?.length ?? 0 }}</dd>
          </div>
        </dl>

        <pre>{{ data }}</pre>
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
  max-width: 980px;
  margin: 0 auto;
  padding: 24px;
  border: 1px solid #d9dee5;
  border-radius: 8px;
  background: #ffffff;
}

.heading {
  display: flex;
  gap: 16px;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 24px;
}

.eyebrow {
  margin: 0 0 6px;
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

button {
  min-width: 112px;
  padding: 10px 14px;
  border: 1px solid #17202a;
  border-radius: 6px;
  background: #17202a;
  color: #ffffff;
  cursor: pointer;
}

button:disabled {
  cursor: wait;
  opacity: 0.7;
}

.state {
  margin: 0;
  padding: 16px;
  border-radius: 6px;
  background: #eef2f6;
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

.result {
  display: grid;
  gap: 18px;
}

dl {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 12px;
  margin: 0;
}

dl div {
  padding: 12px;
  border: 1px solid #d9dee5;
  border-radius: 6px;
}

dt {
  margin-bottom: 4px;
  color: #697586;
  font-size: 0.78rem;
  font-weight: 700;
  text-transform: uppercase;
}

dd {
  margin: 0;
  overflow-wrap: anywhere;
}

pre {
  max-height: 560px;
  margin: 0;
  padding: 16px;
  overflow: auto;
  border-radius: 6px;
  background: #101828;
  color: #e6edf3;
  font-size: 0.85rem;
  line-height: 1.5;
}

@media (max-width: 640px) {
  .heading {
    align-items: stretch;
    flex-direction: column;
  }

  button {
    width: 100%;
  }
}
</style>
