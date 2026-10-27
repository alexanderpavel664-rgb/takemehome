# Licences des médias de la vidéo d'adoptions

Preuve, pour chaque fichier retenu, de sa source et de sa licence. Le
fichier téléchargé est dans `audio-sources/`, ce qu'en fait
`scripts/prepare-audio.mjs` dans `public/audio/` — les deux hors git (la
licence Mixkit interdit de redistribuer les fichiers seuls). En cas de
perte, le retélécharger depuis l'URL du fichier, vérifier l'empreinte
SHA-256, puis `npm run audio`.

La musique seule porte la vidéo : aucun effet sonore, aucune voix, aucun
son généré. Les photos sont celles des annonces de takemehome.ro : leur
republication sur les réseaux de la plateforme relève du point 8 de
/termeni (version du 13 septembre 2026), avec ses engagements — aucune
personne reconnaissable (revue humaine, data/revue-photos.json), ni le nom
ni le contact du publiant, photo réenvoyée en fichier, retrait sur demande
par email.

## Logiciel

- **Remotion** 4.0.539 — licence Remotion, « Free License » : société à
  but lucratif de 3 personnes au plus (Kotech Engineering : 2 personnes, dont
  le dirigeant, aucun prestataire extérieur sur TakeMeHome ; vérifié le
  27 octobre 2026). À revoir si l'effectif atteint 4 personnes :
  https://github.com/remotion-dev/remotion/blob/main/LICENSE.md,
  https://www.remotion.dev/docs/license/faq
- **ffmpeg-static** 5.2.0 (ffmpeg 6.0, binaire GPL) — outil de préparation
  audio, utilisé en local seulement ; rien de ffmpeg n'est distribué avec la
  vidéo.

## Musique — Mixkit Stock Music Free License

Texte de la licence : https://mixkit.co/license/#musicFree (consulté le
27 octobre 2026). Autorisé : « Social Media video posts », « Online
marketing ads », usage commercial ; « You're permitted to download, copy,
modify, distribute and publicly perform the Music Items on any web or
social media platform ». Interdit : CD/DVD, TV et radio, jeux vidéo, remix
en piste musicale seule, revendication ou enregistrement auprès d'un
service de gestion de droits (Content ID). Pas d'attribution exigée. En
cas de réclamation automatique : team@mixkit.co.

Piste retenue le 27 octobre 2026, après comparaison de six pistes sur la
vidéo elle-même : Soul Damage, de Diego Nava. Les cinq autres ont été
retirées de ce fichier, de audio-sources/ et de public/audio/.

Mixkit n'a pas de page par piste : l'étiquette de licence figure dans la
page de liste, dans ses données structurées (champ `copyrightNotice` =
« Mixkit Stock Music Free License », champ `license` =
https://mixkit.co/license/#musicFree). Vérifiée sur les deux pages
indiquées.

| Fichier local | Titre | Auteur | Pages où l'étiquette a été vérifiée | URL du fichier | Téléchargé le | Tempo mesuré | SHA-256 |
| --- | --- | --- | --- | --- | --- | --- | --- |
| `soul-damage.mp3` | Soul Damage (n° 483) | Diego Nava | https://mixkit.co/free-stock-music/chillout/?page=2 | https://assets.mixkit.co/music/483/483.mp3 | 27 octobre 2026 | 114 BPM, 4/4 | `eb9ef8968ef7204bf7744224a4a5f2ef28d2f3e371242012c3c4db0af147304f` |

Étiquettes Mixkit (aucune ne mentionne de voix) : Chillout, Electronica,
Relaxed, Positive, Bass, Drums, Motivational, Relaxation.

Tempo : peigne de croches sur le flux spectral (114,00 BPM). Le kick
tombe sur la croche qui suit les attaques aiguës : phase prise sur la
grille des croches, puis vérifiée sur le fichier préparé (kick à 2 ms du
premier temps, résidus sous 9 ms).

Modifications (permises par la licence) : passage de onze mesures et un
temps à partir de la mesure 24 de la piste (49,47 s), mesure 1 sans grave,
mesure 6 filtrée, fondu d'une mesure jusqu'au silence à partir du 2e temps
de la mesure 11, limiteur doux et niveau (−14 LUFS, −1,6 dBTP). La musique
n'est jamais publiée seule, toujours dans la vidéo. La même piste chaque
mois.
