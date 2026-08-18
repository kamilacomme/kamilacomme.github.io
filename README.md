# Kamila Comme — portfolio

Site statique. Aucun build, aucune dépendance à installer : `index.html` s'ouvre tel quel.

## Structure

    index.html          la page (desktop / tablette / mobile dans un seul fichier)
    support.js          runtime de rendu
    curtain-cloth.js    animation du rideau dans le footer
    assets/             images (webp), vidéos (mp4), curseur, favicon, og-image
    _ds/                design system : tokens (couleurs, typo, espacements) + styles
    .nojekyll           indispensable sur GitHub Pages (sinon le dossier _ds/ est ignoré)

## Mise en ligne — GitHub Pages

1. Créer un dépôt public, par exemple `kamilacomme.github.io`.
2. Copier le contenu de ce dossier à la racine du dépôt (pas le dossier `site/` lui-même).
3. `git add . && git commit -m "Portfolio" && git push`
4. Repository → Settings → Pages → Source : `Deploy from a branch`, branche `main`, dossier `/ (root)`.
5. La page est en ligne sur `https://<utilisateur>.github.io` après une à deux minutes.

## Nom de domaine

Ajouter un fichier `CNAME` à la racine contenant le domaine (une ligne, ex. `kamilacomme.com`),
puis chez le registrar : un `CNAME` pour `www` vers `<utilisateur>.github.io`, et quatre
enregistrements `A` pour le domaine nu vers `185.199.108.153`, `185.199.109.153`,
`185.199.110.153`, `185.199.111.153`.

## À faire avant l'envoi à un concours

Cinq des six billets pointent encore vers des URL provisoires (x.com, facebook, instagram,
t.me, threads). Les vraies adresses se changent en un seul endroit, dans `index.html`,
méthode `ticketLinks()` — les trois mises en page les lisent au même endroit.
