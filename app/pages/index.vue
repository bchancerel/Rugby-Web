<script setup lang="ts">
    import { featuredCompetitions } from '~/constants/featuredCompetitions'

    useHead({
        title: 'RugbyJam | Accueil',
    })
</script>

<template>
    <main class="home-page">
        <section class="hero" aria-labelledby="home-title">
            <div class="hero-overlay">
                <NuxtLink to="/" class="home-logo-link" aria-label="RugbyJam">
                    <img src="/images/logo_app.svg" alt="RugbyJam" class="home-logo">
                </NuxtLink>

                <div class="hero-content">
                    <p class="eyebrow">RugbyJam</p>
                    <h1 id="home-title" class="hero-title">Le rugby, partout, facilement</h1>
                    <p class="hero-copy">
                        Retrouve tous les résultats, classements et statistiques de tes compétitions de rugby préférées en un seul endroit.
                    </p>

                    <div class="hero-actions">
                        <NuxtLink to="/login" class="primary-button">
                            Se connecter
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </section>

        <section id="overview" class="overview" aria-label="Aperçu RugbyJam">
            <div class="overview-inner">
                <div class="metric">
                    <span class="metric-value">Ligues</span>
                    <span class="metric-label">Toutes les compétitions de rugby à travers le monde</span>
                </div>
                <div class="metric">
                    <span class="metric-value">Match</span>
                    <span class="metric-label">Suivi en direct des résultats et statistiques.</span>
                </div>
                <div class="metric">
                    <span class="metric-value">Mobile / Web</span>
                    <span class="metric-label">Accède à RugbyJam sur ton téléphone ou ton ordinateur.</span>
                </div>
            </div>
        </section>

        <section class="competitions" aria-labelledby="competitions-title">
            <div class="competitions-heading">
                <p class="eyebrow">Compétitions</p>
                <h2 id="competitions-title">Les grands rendez-vous rugby</h2>
            </div>

            <div class="competition-carousel" aria-label="Compétitions majeures de rugby">
                <div
                    v-for="track in 2"
                    :key="track"
                    class="competition-track"
                    aria-hidden="true"
                >
                    <article
                        v-for="competition in featuredCompetitions"
                        :key="`${track}-${competition.name}`"
                        class="competition-item"
                    >
                        <img
                            :src="competition.imagePath"
                            :alt="competition.name"
                            class="competition-image"
                        >
                        <span>{{ competition.name }}</span>
                    </article>
                </div>
            </div>
        </section>

        <footer class="site-footer">
            <NuxtLink to="/mentions-legales">
                Mentions légales
            </NuxtLink>
            <a href="https://www.benjaminchancerel.com" target="_blank" rel="noopener noreferrer">
                www.benjaminchancerel.com
            </a>
        </footer>
    </main>
</template>
