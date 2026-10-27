# Vidéo d'adoptions TakeMeHome

Projet Remotion à part, avec ses propres dépendances. Il est exclu du
typecheck, du lint et du build du site, et du déploiement Vercel
(`.vercelignore`). La vidéo ne lit jamais la base : seulement
`data/export.json` et les photos copiées dans `public/photos/`.

## Regénérer la vidéo le mois prochain

Depuis `video/`, après `npm install` :

1. **Export** : `npm run export`. Lit la production en transaction READ ONLY
   (`PRODUCTION_DATABASE_URL` de `.env.local`) et écrit `data/export.json` et
   `public/photos/`.
2. **Photos** : `npm run photos`. Mesure les nouvelles photos et prépare les
   photos de la vidéo. Une photo n'est utilisée que si un humain l'a revue :
   ajouter son identifiant à `data/revue-photos.json` (`approved`, ou
   `rejected` avec la raison), puis choisir la distribution dans
   `data/casting.json`. Ces deux fichiers sont locaux, hors git.
3. **Musique** : `npm run audio`. Prépare Soul Damage (Diego Nava, 114 BPM,
   onze mesures et un temps, −14 LUFS) depuis `audio-sources/soul-damage.mp3`.
   En cas de perte, la retélécharger depuis l'URL donnée dans `LICENCES.md`
   et vérifier son empreinte.
4. **Rendu** : `npm run rendu`. Rend les variantes A et B dans `out/`, puis
   vérifie automatiquement :
   - le format : 1080 × 1920, 30 i/s, H.264, au moins 10 Mb/s ;
   - le son : sonie autour de −14 LUFS, crête vraie sous −1 dBTP ;
   - les flashs : au plus 3 par seconde.

   La commande s'arrête si une exigence n'est pas tenue.

Aperçu : `npx remotion studio`.

## Licences

Remotion (Free License, Kotech Engineering : moins de 4 personnes), la
musique Mixkit et les photos : voir `LICENCES.md`.

## Règles à garder

- Jamais le nom ni le contact d'un publiant. Les annonces dont le nom
  ressemble à un nom de personne sont écartées à l'export ; leurs seuls
  identifiants vont dans `data/noms-personnes.json`.
- Aucune URL Vercel Blob dans le code, les données ou la vidéo : elles
  contiennent l'identifiant du compte du publiant. Les photos sont copiées et
  nommées par leur identifiant.
- Aucune personne reconnaissable sur les photos (revue humaine), ni texte,
  numéro, filigrane ou logo, ni animal blessé, malade ou en détresse.
- Au plus 3 flashs par seconde (WCAG 2.3.1). La rafale ne dépasse jamais
  6 photos par seconde, et `scripts/verifie-flashs.mjs` le mesure à chaque
  rendu.
- Toujours « de pe takemehome.ro », jamais « prin ».
- Rien de tout cela n'entre dans git : `data/`, `public/photos/`,
  `public/audio/`, `audio-sources/`, `out/`.
