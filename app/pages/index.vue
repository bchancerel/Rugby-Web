<script setup lang="ts">
    import '~/assets/css/components/vitrine.css'

    const competitions = [
        { name: 'Top 14',  imagePath: '/images/competitions/top-14.png' },
        { name: 'Six Nations',  imagePath: '/images/competitions/6-nations.png' },
        { name: 'Rugby Championship',  imagePath: '/images/competitions/rugby-championship.jpg' },
        { name: 'Champions Cup',  imagePath: '/images/competitions/champions-cup.png' },
        { name: 'Challenge Cup',  imagePath: '/images/competitions/challenge-cup.png' },
        { name: 'United Rugby Championship',  imagePath: '/images/competitions/urc.png' },
        { name: 'Premiership Rugby',  imagePath: '/images/competitions/premiership-rugby.svg' },
        { name: 'Super Rugby Pacific',  imagePath: '/images/competitions/super-rugby-pacific.png' },
        { name: 'Pro D2',  imagePath: '/images/competitions/pro-d2.png' },
        { name: 'Major League Rugby',  imagePath: '/images/competitions/major-league-rugby.png' },
        { name: 'Rugby World Cup',  imagePath: '/images/competitions/rugby-world-cup.png' },
    ]

    useHead({
        title: 'RugbyJam | Accueil',
    })
</script>

<template>
    <main class="home-page">
        <section class="hero" aria-labelledby="home-title">
            <div class="hero-overlay">
                <header class="topbar">
                    <img src="/images/logo_app.svg" alt="RugbyJam" class="brand-logo">
                </header>

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
                        v-for="competition in competitions"
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
            <NuxtLink to="/mentions-légales">
                Mentions légales
            </NuxtLink>
            <a href="https://www.benjaminchancerel.com" target="_blank" rel="noopener noreferrer">
                www.benjaminchancerel.com
            </a>
        </footer>
    </main>
</template>
