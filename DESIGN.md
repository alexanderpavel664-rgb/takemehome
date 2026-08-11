---
name: TakeMeHome
description: Fiches d'adoption chaleureuses, de personne à personne, pour les animaux sauvés de Roumanie
colors:
  terracotta: "#C4552F"
  forest-adopted: "#2F6B4F"
  cream-ground: "#F7F3EA"
  card-ivory: "#FFFDF8"
  warm-ink: "#2B2622"
  warm-gray: "#6B625A"
  warm-border: "#EAE1D2"
  white: "#FFFFFF"
typography:
  logo:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontWeight: 600
  display:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontWeight: 600
    fontSize: "32px"
    lineHeight: 1.05
  title:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontWeight: 600
  body:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontWeight: 400
    lineHeight: 1.5
  label:
    fontFamily: "Plus Jakarta Sans, system-ui, sans-serif"
    fontWeight: 400
rounded:
  md: "20px"
  pill: "9999px"
components:
  button-primary:
    backgroundColor: "{colors.terracotta}"
    textColor: "{colors.white}"
    rounded: "{rounded.md}"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.terracotta}"
    rounded: "{rounded.md}"
  badge-adopted:
    backgroundColor: "{colors.forest-adopted}"
    textColor: "{colors.white}"
    rounded: "{rounded.pill}"
  card:
    backgroundColor: "{colors.card-ivory}"
    rounded: "{rounded.md}"
---

<!-- SEED: valeurs gelées issues de design-idees.md et confirmées avec l'utilisateur avant implémentation ; re-lancer /impeccable document quand l'interface aura adopté ce monde, pour capturer les composants réels. -->

# Design System: TakeMeHome

## Overview

**Creative North Star: « De la om la om »** (de personne à personne)

TakeMeHome est une annonce d'adoption écrite par quelqu'un qui aime cet animal — pas une vitrine corporate. Le système visuel est du papier chaud : un fond crème calme sur lequel les photos amateur des sauveteurs sont posées comme des instantanés. Ces photos, imparfaites, sont une **preuve d'authenticité**, jamais un défaut à masquer : l'interface reste plate, silencieuse et régulière pour que l'animal et la personne qui le sauve soient les seules choses vivantes à l'écran.

Chaque écran a une seule action qui compte — presque toujours appeler — et elle est la seule tache terracotta pleine visible. Tout le reste s'efface : pas d'ombres au repos, pas de décor, pas d'illustration. Le produit vit d'abord sur téléphone, souvent en 4G : la légèreté (une seule police variable, images compressées, aplat plutôt qu'effet) est un choix esthétique autant que technique.

Rejets confirmés : logo cœur + patte (cliché, illisible en petit), images de stock ou générées par IA, toute décoration qui concurrence les photos.

**Key Characteristics:**
- Papier chaud et plat : crème, hairlines, aucun relief au repos
- Une seule action pleine par écran, en terracotta
- Les photos amateur mènent ; l'interface recule
- Roumain impeccable, virgule souscrite comprise
- Léger en 4G par principe, pas par contrainte

## Colors

Une palette de papier et de terre : des neutres chauds qui laissent toute la saturation aux photos, un seul accent terracotta rare, un vert forêt réservé au dénouement heureux.

### Primary
- **Terracotta** (#C4552F) : l'action. Boutons et logo **uniquement** — jamais les liens, icônes, états ou décor. Sa rareté est ce qui rend l'appel évident.

### Secondary
- **Vert Adoptat** (#2F6B4F) : le statut « Adoptat » exclusivement — pastille pleine, texte blanc. C'est la couleur de la bonne nouvelle, elle ne sert à rien d'autre.

### Neutral
- **Crème de fond** (#F7F3EA) : le papier. Fond de toutes les pages et de l'aplat de repli sans photo.
- **Ivoire carte** (#FFFDF8) : surface des cartes et champs de formulaire.
- **Encre chaude** (#2B2622) : texte principal, icônes, indicateurs de focus et d'état actif.
- **Gris chaud** (#6B625A) : texte secondaire (métadonnées, légendes). Contraste mesuré 5,3:1 sur crème ✓.
- **Bordure chaude** (#EAE1D2) : hairlines des cartes, chips et champs — la seule séparation au repos.

### Named Rules
**La Règle Terracotta.** Terracotta = boutons + logo, rien d'autre. Un lien, une icône, un focus ring ou un graphique en terracotta est une faute ; ces rôles reviennent à l'encre chaude.

**La Règle du Bouton Unique.** Un seul bouton plein par écran. Toutes les autres actions sont en bordure terracotta (fond transparent) ou en encre chaude.

**La Règle du Chien Fauve.** La terracotta habite les mêmes tons qu'un pelage fauve. Le bouton d'appel ne se superpose jamais à une photo : il repose sur un fond opaque crème ou ivoire, libellé blanc gras. Toute évolution de ce bouton se valide sur maquette **à côté d'une photo de chien fauve**, jamais sur fond blanc.

**Contrastes mesurés** (à confirmer sur device en P6) : encre/crème ≈ 13:1 ✓ · gris chaud/crème 5,3:1 ✓ · blanc/vert Adoptat 6,2:1 ✓ · **blanc/terracotta 4,49:1** — un cheveu sous 4,5:1 : libellés des boutons pleins en 600 et ≥ 19 px ; à 600, l'argument « texte large en gras » (3:1) est moins solide qu'à 700 — si l'écran réel déçoit, monter la taille vers 24 px (« texte large » sans condition de graisse, 3:1 ✓), jamais la graisse. Si un libellé plein plus petit devient indispensable, la décision (ajuster d'un cheveu la terracotta ou assumer 4,49:1) appartient à l'utilisateur — la palette est gelée.

## Typography

**Interface Font:** Plus Jakarta Sans (variable, via next/font, avec system-ui en repli)

**Character:** Géométrique et amicale sans être enfantine — la voix d'une annonce sérieuse écrite par quelqu'un de chaleureux. Une seule famille variable porte toute l'interface ; le logo en dérive, vectorisé en courbes (voir Components). Plus Jakarta Sans a une grande hauteur d'x : sa graisse optique dépasse sa valeur numérique — l'échelle reste donc légère. L'approche est naturelle (0) partout, sans exception ni resserrement — aucune règle d'espacement à retenir.

### Hierarchy
Deux graisses, pas une de plus — **400** le corps, les métadonnées et les chips ; **600** le logo, les noms d'animaux, les titres de sections et les libellés de boutons — chacune porte un sens. La graisse ne porte jamais seule la hiérarchie : la taille, l'approche et la couleur travaillent avec elle — un nom à 32 px/600 face à un corps à 15 px/400 est plus fort qu'un titre à 26 px/700. Les poids viennent de l'axe variable, jamais d'un second import :
- **Display / nom d'animal (fiche)** (600, ~32 px, line-height 1.05) : le nom de l'animal est le titre. Sert aussi d'aplat de repli sans photo.
- **Nom d'animal (cartes de grille)** (600, ~19 px) : le nom mène la carte ; les métadonnées restent en Label.
- **Title** (600, ~18–20 px) : titres de sections.
- **Body** (400, 15–16 px, line-height 1.5) : descriptions écrites par les publiants — jamais sous 15 px pour un texte long (16 px minimum dans les champs, zoom iOS).
- **Label** (400, 13–14 px) : métadonnées, labels de champs, chips. **À tester : le « 1 » à 14 px sur téléphone réel.**

### Named Rules
**La Règle de la Virgule Souscrite.** Les diacritiques roumains utilisent la virgule souscrite : ș (U+0219), ț (U+021B) — jamais les formes cédille ş (U+015F), ţ (U+0163). `lang="ro"` sur `<html>` est obligatoire (le code actuel porte `lang="en"` — à corriger). Plus Jakarta Sans est validée pour ces glyphes ; toute police de remplacement doit l'être aussi.

**La Règle de la Police Unique.** Une seule famille variable, un seul import. Un second poids ou une seconde famille importée = CLS et 4G punis — interdit.

## Layout

Mobile-first, desktop soigné : chaque écran se conçoit pour le téléphone, le desktop hérite et s'adapte — certains publiants saisissent depuis leur ordinateur, et une partie des adoptantes ouvre les liens Facebook sur un portable. Marges régulières sur le papier crème, respiration plus grande au-dessus des titres qu'en dessous. Échelle d'espacement : la gamme Tailwind par défaut (4 px) suffit — pas d'échelle custom.

- **Grille `/animale`** : 2 colonnes sur mobile, 3 à 4 sur desktop ; cartes photo à format fixe (ratio identique partout, à fixer à l'implémentation).
- **Fiche `/animal/[id]`** : empilée sur mobile ; deux colonnes possibles sur desktop — photo à gauche, identité + contact à droite.
- **Filtres** : bottom sheet sur mobile ; colonne latérale possible sur desktop.
- **Largeur maximale de contenu** sur grand écran — le texte ne s'étire jamais sur toute la largeur.

**Invariants, quelle que soit la taille d'écran** : bouton d'appel dans la zone du pouce sur mobile (bas d'écran) ; cibles tactiles ≥ 44 px ; aucune fonctionnalité qui dépende du survol de souris.

## Elevation & Depth

Plat par défaut, sans exception au repos : la profondeur vient de la hairline chaude (#EAE1D2) et du micro-contraste ivoire/crème, jamais d'une ombre. Les ombres n'existent que pour les surfaces **détachées** du papier — sheet de filtres, dialogues — avec une ombre chaude et douce (teintée encre, jamais noir pur).

### Named Rules
**La Règle du Plat.** Une carte au repos n'a pas d'ombre. Si un élément projette une ombre, c'est qu'il flotte réellement au-dessus de la page (sheet, dialogue) — rien d'autre ne flotte.

## Shapes

Angles généreux de 20 px partout — cartes, boutons, champs, photos : la rondeur sert la lisibilité en grille 2 colonnes sur mobile, où un angle plus sec paraît dur (décision prise sur comparaison visuelle avec une carte réelle). Le sérieux du produit vient du calme de la palette et de la retenue de l'interface, pas de l'angle. La pilule (9999 px) reste **strictement** réservée aux pastilles de statut (« Adoptat ») et aux chips de filtre — à 20 px l'écart avec la pilule se resserre, ne la généralise pas ailleurs. Le logo suit sa propre géométrie gelée — patte terracotta à gauche du mot « takemehome » vectorisé en courbes depuis Plus Jakarta Sans 600, spécification complète dans Components — **une forme, deux lectures, lisible à 16×16 px**.

## Components

### Bouton d'appel (signature)
L'unique bouton plein de la fiche et la raison d'être du produit : `tel:`, fond terracotta, libellé blanc 600 ≥ 19 px avec icône téléphone, 20 px de rayon, hauteur ≥ 48 px, posé sur fond crème/ivoire opaque sous la photo — validé à côté d'une photo de chien fauve (voir La Règle du Chien Fauve).

### Logo (SVG vectorisé)
L'identité est un dessin, pas du texte stylé : la patte **et** le mot forment un seul SVG inline, texte converti en courbes — aucun rendu ne dépend d'une police installée chez le visiteur.

- **Composition (maquettée et validée)** : la patte à **gauche** du mot « takemehome », alignée optiquement sur le centre du mot ; hauteur de la patte ≈ 1,1 × la hauteur d'x du mot.
- **La patte** : 4 coussinets ovales en arc au-dessus, un coussinet principal plus large en dessous — terracotta #C4552F plein, aucun contour, aucun dégradé.
- **Le mot** : bas de casse, encre chaude #2B2622, espacement naturel, **graisse 600** vectorisée en courbes — le 700 rendait trop lourd, la graisse optique de Plus Jakarta Sans dépassant sa valeur numérique.
- **Accessibilité — obligatoire** : le SVG porte `role="img"` et `aria-label="takemehome"` ; sans eux, un lecteur d'écran annonce « image » et le lien d'accueil devient muet.
- **Variantes** : le lockup complet (patte + mot) pour l'en-tête ; la patte seule pour le favicon 16×16.
- **Hygiène** : SVG léger — pas de métadonnées d'éditeur, pas de calques inutiles.
- **Exception explicite à La Règle Terracotta** : le logo est le seul endroit hors boutons où la terracotta apparaît — la règle le prévoit, ceci le rend explicite.
- **Implémentation** : un composant `Logo` réutilisable (en-tête, page d'accueil, favicon) ; l'export en courbes provient de la maquette validée — asset à déposer dans le repo.

### Buttons
- **Shape:** angles généreux (20 px), hauteur tactile ≥ 44–48 px
- **Primary:** fond terracotta (#C4552F), texte blanc (600) — un seul par écran
- **Outline:** fond transparent, bordure 1,5 px terracotta, texte terracotta — toutes les autres actions
- **Hover / Focus:** assombrissement léger du fond ; focus visible en encre chaude (jamais terracotta), `focus-visible` uniquement

### Badge « Adoptat »
Pastille pleine vert forêt (#2F6B4F), texte blanc (600), pilule. Posée sur la photo ou la carte, elle est la seule chose qui ait le droit de recouvrir une photo.

### Chips (filtres)
Pilule, fond ivoire, hairline chaude, libellé encre chaude. Sélectionné : fond encre chaude, texte blanc (provisoire — la terracotta est interdite ici).

### Cards / Containers
- **Corner Style:** 20 px
- **Background:** ivoire (#FFFDF8) sur crème
- **Border:** hairline 1 px #EAE1D2 — la seule séparation
- **Shadow Strategy:** aucune au repos (La Règle du Plat)
- **Photo:** format fixe, `object-fit: cover`, recadrage centré ; **sans photo : aplat crème + nom de l'animal en Display 600** — jamais d'image de remplacement

### Inputs / Fields
Fond ivoire, hairline chaude, 20 px, texte 16 px (évite le zoom iOS). Focus : bordure encre chaude épaissie. Erreur : message en toutes lettres sous le champ — pas seulement une couleur.

### Navigation
Encre chaude sur crème ; l'état actif se marque au poids (600), pas à la couleur. La fiche `/animal/[id]` — entrée principale depuis Facebook — porte toujours un chemin évident vers `/animale`.

## États

Les écrans vides, d'attente et d'erreur sont des écrans à part entière, dessinés dans le même monde — jamais des cas limites laissés au navigateur.

- **Liste vide (aucun animal en base)** : le papier assume le silence. Message centré sur crème — titre en encre chaude (Title 600), explication en gris chaud — sans carte fantôme ni illustration. Au plus une action, en outline (La Règle du Bouton Unique tient aussi ici).
- **Aucun résultat après filtrage** : même construction, avec une **invite explicite à réinitialiser** — bouton outline type « Resetează filtrele » (libellé indicatif) juste sous le message. On ne laisse jamais quelqu'un face à une grille vide sans issue.
- **Chargement** : cartes squelettes aux dimensions exactes des cartes réelles — même ratio photo, mêmes 20 px, mêmes hairlines — en pulsation douce entre ivoire et crème (immobile sous `prefers-reduced-motion`). **Jamais de page blanche**, jamais de spinner plein écran.
- **Photo qui ne charge pas** : identique à l'absence de photo — aplat crème + nom de l'animal en Display 600. L'échec réseau ne se présente jamais comme une erreur.
- **Erreur de formulaire** : le champ passe en bordure encre épaissie et le message s'écrit **en toutes lettres sous le champ** (encre chaude, 600, 14 px) — la couleur seule ne porte jamais l'erreur. La palette gelée ne contient pas de rouge ; en introduire un serait une décision utilisateur, pas un réflexe.
- **404 / animal introuvable** : un lien Facebook mort est un scénario courant, pas une exception. Aplat crème, titre en encre chaude, explication en gris chaud, et le chemin évident : **le** bouton plein de l'écran mène vers `/animale` — ici, c'est lui l'action qui compte.

### Named Rules
**La Règle de la Sortie.** Aucun état ne laisse l'utilisateur sans chemin ni explication : liste vide → un mot clair, filtre sans résultat → réinitialiser, erreur → corriger, 404 → `/animale`.

## Do's and Don'ts

### Do:
- **Do** garder un seul bouton plein terracotta par écran ; toutes les autres actions en outline ou en encre.
- **Do** valider toute évolution du bouton d'appel à côté d'une photo de chien fauve, pas sur fond blanc.
- **Do** utiliser ș/ț à virgule souscrite (U+0219/U+021B) et déclarer `lang="ro"` sur `<html>`.
- **Do** servir les vraies photos des publiants en format fixe, `object-fit: cover`, recadrage centré — et l'aplat crème + nom en grand quand il n'y en a pas.
- **Do** garder les libellés des boutons pleins en 600 et ≥ 19 px tant que la terracotta reste à 4,49:1 sous le blanc — s'ils déçoivent, monter la taille, pas la graisse.
- **Do** rester sur une seule police variable (Plus Jakarta Sans via next/font) et des pages légères en 4G.

### Don't:
- **Don't** utiliser la terracotta ailleurs que sur les boutons et le logo — ni liens, ni icônes, ni états.
- **Don't** mettre d'ombre sur une surface au repos ; les ombres appartiennent aux sheets et dialogues.
- **Don't** utiliser d'images de stock ou décoratives sur les fiches, et **jamais** d'images d'animaux générées par IA.
- **Don't** importer une seconde famille ou un second fichier de police.
- **Don't** livrer de mode sombre en V1 : le monde est ce papier crème (retirer la bascule `prefers-color-scheme` du boilerplate).
- **Don't** rouvrir le logo cœur + patte, le renommage Petly, ni la palette — décisions gelées.

## À valider sur écran réel

Checklist de la validation P6 (10 vraies photos, téléphone réel) — le papier a tranché, l'écran confirme :

- **Hiérarchie allégée (600/400)** : confirmer sur écran réel que le contraste de taille porte la hiérarchie — le 800 est abandonné ; si un niveau manque de présence, augmenter la taille avant la graisse.
- **Couleur des chips de filtre sélectionnés** : l'encre chaude pleine est peut-être trop sévère sur du crème — à confronter aux photos réelles dans la grille.
- **Contraste blanc/terracotta (4,49:1)** : vérifier la lisibilité réelle des libellés ≥ 19 px en 600 sur device, luminosité basse comprise.
- **Logo à 600 dans l'en-tête** : à 600, le logo a la même graisse que les noms d'animaux et ne se distingue plus que par la taille et la patte terracotta. Si le mot paraît mou dans l'en-tête, augmenter sa **taille**, pas sa graisse.
- **Le « 1 » des numéros de téléphone à 14 px** : sur téléphone réel — lisibilité et confusion possible avec l/I.
- **L'arrondi de 20 px sur les photos** : vérifier avec de vraies photos que l'angle n'entame pas trop le sujet sur les images mal cadrées (tête ou museau en bord de cadre).
