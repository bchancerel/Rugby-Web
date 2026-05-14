<script setup lang="ts">
    useHead({
        title: 'RugbyJam | Mentions legales',
    })
</script>

<template>
    <main class="legal-page">
        <section class="legal-panel">
            <NuxtLink to="/" class="legal-back-link">
                Retour a l'accueil
            </NuxtLink>

            <h1>Mentions legales</h1>

            <p>
                RugbyJam est un projet edite par Benjamin Chancerel.
            </p>

            <p>
                Site portfolio :
                <a href="https://www.benjaminchancerel.com" target="_blank" rel="noopener noreferrer">
                    www.benjaminchancerel.com
                </a>
            </p>
        </section>
    </main>
</template>

<style scoped>
.legal-page {
    min-height: 100vh;
    padding: 48px 20px;
    background: #07111d;
    color: #ffffff;
}

.legal-panel {
    max-width: 760px;
    margin: 0 auto;
}

.legal-back-link,
.legal-panel a {
    color: #ff4655;
    font-weight: 800;
    text-decoration: none;
}

.legal-back-link:hover,
.legal-panel a:hover {
    color: #ffffff;
}

h1 {
    margin: 28px 0 18px;
    font-size: clamp(2.4rem, 6vw, 4.5rem);
    line-height: 1;
}

p {
    color: #d7dee8;
    font-size: 1.05rem;
    line-height: 1.7;
}

@media (max-width: 420px) {
    .legal-page {
        padding: 32px 14px;
    }

    h1 {
        font-size: 2.3rem;
    }
}
</style>
