<script setup lang="ts">
const updatedAt = '25 mai 2026'

const legalSections = [
  {
    title: 'Éditeur du site',
    paragraphs: [
      'RugbyJam est une application web éditée par Benjamin Chancerel, dans le cadre d’un projet personnel dédié au suivi des compétitions, matchs, classements et statistiques de rugby.',
      'Pour toute demande liée à l’application, vous pouvez utiliser le site portfolio de l’éditeur.',
    ],
    link: {
      label: 'www.benjaminchancerel.com',
      href: 'https://www.benjaminchancerel.com',
    },
  },
  {
    title: 'Responsable de publication',
    paragraphs: [
      'Le responsable de la publication est Benjamin Chancerel.',
      'RugbyJam a pour vocation de centraliser des informations sportives et de proposer une expérience de consultation simple pour les supporters de rugby.',
    ],
  },
  {
    title: 'Hébergement',
    paragraphs: [
      'L’API et les services techniques associés à RugbyJam sont prévus pour être hébergés sur Railway, avec une base PostgreSQL et un cache Redis.',
      'L’hébergement de l’interface web peut varier selon l’environnement de déploiement. Les informations définitives d’hébergement doivent être vérifiées avant toute mise en production publique.',
    ],
  },
  {
    title: 'Accès au service',
    paragraphs: [
      'RugbyJam permet de consulter des compétitions de rugby, des matchs, des classements, des statistiques d’équipes et des favoris utilisateur.',
      'Certaines fonctionnalités nécessitent la création d’un compte, notamment la gestion des favoris, du profil, des sessions et des préférences liées à l’expérience supporter.',
    ],
  },
  {
    title: 'Données personnelles',
    paragraphs: [
      'Les données collectées sont limitées aux informations nécessaires au fonctionnement du compte utilisateur : adresse email, nom d’utilisateur, mot de passe chiffré, rôle, sessions, favoris et événements liés à la progression supporter.',
      'Les données d’authentification sont utilisées pour sécuriser l’accès au compte, permettre la vérification email, gérer les réinitialisations de mot de passe et protéger les routes privées de l’application.',
      'Un utilisateur connecté peut modifier ses informations de profil, révoquer ses sessions ou supprimer son compte depuis son espace personnel.',
    ],
  },
  {
    title: 'Cookies et stockage',
    paragraphs: [
      'RugbyJam utilise des mécanismes techniques nécessaires à l’authentification et au maintien de session, notamment des jetons d’accès et de rafraîchissement.',
      'Ces éléments servent uniquement au bon fonctionnement de l’application et à la sécurité du compte utilisateur.',
    ],
  },
  {
    title: 'Données sportives',
    paragraphs: [
      'Les informations sportives affichées dans RugbyJam peuvent provenir de fournisseurs tiers, notamment API-SPORTS Rugby, puis être mises en cache ou enrichies par l’API RugbyJam.',
      'Malgré le soin apporté à l’affichage des résultats, calendriers, classements et statistiques, RugbyJam ne garantit pas l’exactitude, l’exhaustivité ou la disponibilité permanente de ces données.',
    ],
  },
  {
    title: 'Propriété intellectuelle',
    paragraphs: [
      'La marque RugbyJam, l’interface, le code applicatif, les textes et les éléments graphiques propres au projet appartiennent à leur auteur, sauf mention contraire.',
      'Les logos, noms de compétitions, noms d’équipes et données sportives restent la propriété de leurs détenteurs respectifs.',
    ],
  },
  {
    title: 'Responsabilité',
    paragraphs: [
      'RugbyJam est fourni à titre informatif. L’éditeur ne peut être tenu responsable d’une indisponibilité temporaire, d’une erreur de donnée sportive, d’un dysfonctionnement externe ou d’une mauvaise utilisation du service.',
      'L’utilisateur reste responsable des informations qu’il renseigne et de la confidentialité de ses identifiants.',
    ],
  },
]

useHead({
  title: 'RugbyJam | Mentions légales',
  meta: [
    {
      name: 'description',
      content: 'Mentions légales de RugbyJam, application de suivi des compétitions, matchs, classements et statistiques de rugby.',
    },
  ],
})
</script>

<template>
  <main class="legal-page">
    <section class="legal-hero" aria-labelledby="legal-title">
      <NuxtLink to="/" class="legal-logo-link" aria-label="Retour à l’accueil RugbyJam">
        <img src="/images/logo_app.svg" alt="RugbyJam" class="legal-logo">
      </NuxtLink>

      <div class="legal-hero-content">
        <p class="legal-eyebrow">RugbyJam</p>
        <h1 id="legal-title">Mentions légales</h1>
        <p class="legal-intro">
          Informations relatives à l’édition, l’hébergement, l’utilisation et la protection des données de l’application RugbyJam.
        </p>
      </div>
    </section>

    <section class="legal-content" aria-label="Contenu des mentions légales">
      <div class="legal-meta">
        <NuxtLink to="/" class="legal-back-link">
          Retour à l’accueil
        </NuxtLink>
        <span>Dernière mise à jour : {{ updatedAt }}</span>
      </div>

      <article
        v-for="section in legalSections"
        :key="section.title"
        class="legal-section"
      >
        <h2>{{ section.title }}</h2>
        <p v-for="paragraph in section.paragraphs" :key="paragraph">
          {{ paragraph }}
        </p>
        <a
          v-if="section.link"
          :href="section.link.href"
          target="_blank"
          rel="noopener noreferrer"
        >
          {{ section.link.label }}
        </a>
      </article>
    </section>
  </main>
</template>

<style scoped>
.legal-page {
  min-height: 100vh;
  background: #07111d;
  color: #ffffff;
}

.legal-hero {
  position: relative;
  display: flex;
  min-height: 48vh;
  align-items: flex-end;
  padding: 132px clamp(20px, 5vw, 72px) 54px;
  overflow: hidden;
  background:
    linear-gradient(90deg, rgba(7, 17, 29, 0.96), rgba(7, 17, 29, 0.78) 52%, rgba(120, 23, 35, 0.64)),
    url('/images/images_acceuil.webp') center right / cover;
}

.legal-hero::after {
  position: absolute;
  inset: auto 0 0;
  height: 1px;
  background: linear-gradient(90deg, transparent, rgba(255, 70, 85, 0.78), transparent);
  content: "";
}

.legal-logo-link {
  position: absolute;
  top: 26px;
  left: 50%;
  display: inline-flex;
  width: 104px;
  height: 104px;
  align-items: center;
  justify-content: center;
  transform: translateX(-50%);
  text-decoration: none;
}

.legal-logo {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.legal-hero-content {
  width: min(820px, 100%);
}

.legal-eyebrow {
  display: inline-flex;
  margin: 0 0 14px;
  padding: 10px 14px;
  border-radius: 6px;
  background: #e63946;
  color: #ffffff;
  font-size: 1.05rem;
  font-weight: 900;
  line-height: 1;
  text-shadow: 0 3px 0 rgba(7, 17, 29, 0.72);
  text-transform: uppercase;
}

.legal-intro {
  max-width: 680px;
  margin: 22px 0 0;
  color: #d7dee8;
  font-size: 1.08rem;
  line-height: 1.7;
}

.legal-content {
  display: grid;
  max-width: 980px;
  margin: 0 auto;
  padding: 34px clamp(20px, 5vw, 48px) 72px;
  gap: 18px;
}

.legal-meta {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px 20px;
  padding-bottom: 10px;
  color: #9ca3af;
  font-size: 0.92rem;
  font-weight: 700;
}

.legal-back-link,
.legal-section a {
  color: #ff4655;
  font-weight: 900;
  text-decoration: none;
}

.legal-back-link:hover,
.legal-section a:hover {
  color: #ffffff;
}

.legal-section {
  padding: 24px 0;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
}

.legal-section h2 {
  margin: 0 0 14px;
  color: #ffffff;
  font-size: clamp(1.25rem, 3vw, 1.7rem);
  font-weight: 900;
  line-height: 1.1;
  text-transform: uppercase;
}

.legal-section p {
  max-width: 820px;
  margin: 0;
  color: #d7dee8;
  font-size: 1rem;
  line-height: 1.75;
}

.legal-section p + p,
.legal-section p + a {
  display: inline-block;
  margin-top: 12px;
}

@media (max-width: 760px) {
  .legal-hero {
    min-height: 56vh;
    padding-top: 122px;
    background:
      linear-gradient(180deg, rgba(7, 17, 29, 0.98), rgba(7, 17, 29, 0.82) 64%, rgba(120, 23, 35, 0.54)),
      url('/images/images_acceuil.webp') center / cover;
  }

  .legal-logo-link {
    width: 88px;
    height: 88px;
  }
}

@media (max-width: 420px) {
  .legal-hero {
    padding-bottom: 42px;
  }

  .legal-eyebrow {
    font-size: 0.95rem;
  }

  .legal-intro,
  .legal-section p {
    font-size: 0.96rem;
  }
}
</style>
