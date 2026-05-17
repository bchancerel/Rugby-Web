<script setup lang="ts">
    import '~/assets/css/components/vitrine.css'
    import { featuredCompetitions } from '~/constants/featuredCompetitions'

    useHead({
        title: 'RugbyJam | Accueil',
    })
</script>

<template>
    <main class="home-page">
        <section class="hero" aria-labelledby="home-title">
            <div class="hero-overlay">
                <div class="hero-content">
                    <p class="eyebrow">RugbyJam</p>
                    <h1 id="home-title">Le rugby, partout, facilement</h1>
                    <p class="hero-copy">
                        Retrouve tous les resultats, classements et statistiques de tes competitions de rugby preferees en un seul endroit.
                    </p>

                    <div class="hero-actions">
                        <NuxtLink to="/login" class="primary-button">
                            Se connecter
                        </NuxtLink>
                    </div>
                </div>
            </div>
        </section>

        <section id="overview" class="overview" aria-label="Apercu RugbyJam">
            <div class="overview-inner">
                <div class="metric">
                    <span class="metric-value">Ligues</span>
                    <span class="metric-label">Toutes les competitions de rugby a travers le monde</span>
                </div>
                <div class="metric">
                    <span class="metric-value">Match</span>
                    <span class="metric-label">Suivi en direct des resultats et statistiques.</span>
                </div>
                <div class="metric">
                    <span class="metric-value">Mobile / Web</span>
                    <span class="metric-label">Accede a RugbyJam sur ton telephone ou ton ordinateur.</span>
                </div>
            </div>
        </section>

        <section class="competitions" aria-labelledby="competitions-title">
            <div class="competitions-heading">
                <p class="eyebrow">Competitions</p>
                <h2 id="competitions-title">Les grands rendez-vous rugby</h2>
            </div>

            <div class="competition-carousel" aria-label="Competitions majeures de rugby">
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
