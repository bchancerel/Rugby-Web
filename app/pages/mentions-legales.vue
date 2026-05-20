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
    max-width: 100%;
    margin: 28px 0 18px;
    color: #ffffff;
    font-family: Impact, Haettenschweiler, "Arial Black", "Segoe UI Black", sans-serif;
    font-size: clamp(2.45rem, 11vw, 3.7rem);
    font-weight: 900;
    line-height: 0.9;
    text-shadow:
        0 3px 0 rgba(230, 57, 70, 0.82),
        0 14px 30px rgba(0, 0, 0, 0.48);
    text-transform: uppercase;
    overflow-wrap: anywhere;
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

}
</style>
