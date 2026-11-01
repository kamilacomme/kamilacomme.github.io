# Kamila Comme — portfolio

Portfolio statique bilingue : français sur `/` et anglais sur `/en/`. GitHub Pages sert les fichiers déjà générés et suivis par Git depuis la racine de `main` ; il ne lance pas le build du site. `.nojekyll` permet de servir les ressources du design system dans `_ds/`.

## Sources et génération

Les sources éditoriales canoniques sont dans `content/` et les modèles dans `templates/`. Le générateur `scripts/content/build.mjs` produit les routes HTML statiques suivies par Git, notamment `index.html`, `en/index.html`, les pages Projects embarquées et `404.html`. Modifiez les sources, puis vérifiez le résultat généré plutôt que d'éditer ces sorties directement.

```sh
npm ci                         # installer les dépendances de développement verrouillées
npm run content:check          # valider le contenu bilingue et ses ressources
npm run content:build:check    # vérifier que les pages générées correspondent aux sources
npm run content:build          # régénérer les pages statiques après une modification approuvée
```

## Tests et aperçu local

`npm test` lance le gate de régression Playwright et QA responsive, avec vérification de l'intégrité des références historiques. Il suppose que les dépendances sont installées et que Chromium est disponible (par défaut `/usr/bin/chromium`). Le contrôle du build déterministe reste une commande séparée : exécutez aussi `npm run content:build:check`.

Pour un serveur local de test :

```sh
npm run test:serve
```

Le serveur affiche l'URL locale. Les contrôles Lighthouse sont plus lourds et séparés : `npm run test:performance`. Consultez [AGENTS.md](AGENTS.md) pour les commandes détaillées, les propriétaires des composants et les règles de modification sûres. Ne mettez pas à jour les 230 références historiques pour faire passer un test.

## Publication

Le déploiement est déclenché par les fichiers validés et générés présents à la racine de `main`; aucun workflow GitHub Actions du dépôt ne construit le site. Avant toute publication autorisée, vérifiez la branche et le commit exacts, l'état Git, le diff, le build bilingue, le gate de régression, les références historiques et la possibilité de restaurer la version précédente. Après publication, contrôlez les routes `/` et `/en/`, les liens principaux, les ressources et les réponses 404 localisées.

Le nom de domaine et le tag qui préserve l'ancienne version sont documentés dans [docs/PROJECT-STATUS.md](docs/PROJECT-STATUS.md).
