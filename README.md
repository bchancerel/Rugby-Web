# RugbyJam Frontend

Frontend Nuxt de RugbyJam.

## Stack

- Nuxt 4
- Vue 3
- TypeScript
- Pinia
- Tailwind CSS
- Vue Query

## Prerequis

- Node.js 20+
- API RugbyJam lancee, par defaut sur `http://localhost:3000`

## Versions

- Application frontend: non versionnee dans `package.json`
- Source GitHub verifiee: `bchancerel/Rugby-Web`, `main` (`f4c23954f124a6487090b7859d538b503075abfa`)
- Build GitHub Actions verifie: aucun run associe au dernier commit `main` via le connecteur GitHub
- Tags/Releases GitHub: aucun tag de version detecte
- Node.js: 20+ recommande
- Nuxt: `^4.4.5`
- Vue: `^3.5.34`
- TypeScript: via `vue-tsc ^3.3.1`
- Tailwind CSS: `^4.3.0`
- Pinia Nuxt: `^0.11.3`
- Vue Query: `^5.100.10`

## Installation

```bash
npm install
```

Copie les variables d'environnement:

```bash
cp .env.example .env
```

Variables principales:

```env
NUXT_API_BASE=http://localhost:3000/api
NUXT_PUBLIC_API_BASE=/api
NUXT_API_PROXY_TARGET=http://localhost:3000/api
```

En local, `NUXT_PUBLIC_API_BASE=/api` laisse le navigateur appeler le serveur Nuxt,
qui proxifie ensuite vers l'API. Cela evite les problemes CORS/cookies pendant le
developpement.

## Developpement

```bash
npm run dev
```

Le frontend demarre par defaut sur:

```text
http://localhost:5173
```

## Fonctionnalites rugby

- Page championnats avec classement, matchs par journee et phases finales.
- Dashboard avec equipes et championnats suivis.
- Page equipe non exposee dans la navbar: `/teams/:id`.
- Acces a la page equipe depuis:
  - le dashboard;
  - les lignes du classement;
  - les cartes de matchs;
  - les cartes quart, demi et finale;
  - la liste des matchs d'une page equipe.

La page equipe utilise les query params suivants pour charger le bon contexte:

```text
/teams/:id?league=:leagueId&season=:season
```

Elle affiche:

- selection championnat / saison;
- statistiques globales, domicile et exterieur;
- forme recente si disponible;
- matchs de l'equipe pour le championnat et la saison selectionnes.

## Scripts

| Script | Description |
|---|---|
| `npm run dev` | Lancer Nuxt en developpement |
| `npm run build` | Builder l'application |
| `npm run generate` | Generer une sortie statique |
| `npm run preview` | Previsualiser le build |
| `npm run postinstall` | Preparer Nuxt |

## Verification

```bash
npm run build
```

Le build peut afficher des warnings de sourcemaps venant de plugins Nuxt/Tailwind. Ils ne bloquent pas la compilation.
