# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- **Adoptantes** (grand public roumain) : naviguent sur téléphone, souvent en 4G, arrivent majoritairement par des liens Facebook directement sur `/animal/[id]`. Leur job : trouver un animal, se décider, appeler la personne qui le sauve.
- **Publiants** : sauveteuses bénévoles individuelles **et** refuges/associations — un seul type de compte, terminologie neutre en roumain (pas « refugiu » seul, pas « salvator » seul). Publient le soir depuis leur téléphone ; photos amateur, de qualité variable, parfois absentes.

Interface 100 % en roumain, diacritiques corrects (ș ț ă â î, virgule souscrite).

## Product Purpose

Plateforme d'adoption d'animaux sauvés en Roumanie. Remplace les posts Facebook éparpillés par des fiches structurées et filtrables, avec un chemin direct vers la personne qui publie. **Succès n°1 de la V1 : des publiants actifs** — qui publient et maintiennent leurs annonces régulièrement. L'offre (les annonces) est le goulot, pas la demande.

## Positioning

La fiche `/animal/[id]` est la page d'entrée principale (partagée sur Facebook). Elle fait ce qu'un post Facebook ne peut pas : statut « Adoptat », filtres, appel direct, permanence du lien. Ce n'est ni un service perdus/trouvés, ni un annuaire de refuges, ni un réseau social.

## Operating Context

- Usage majoritairement mobile des deux côtés ; certains publiants et adoptantes seront sur ordinateur — mobile-first, desktop soigné. Adoptantes souvent en 4G → le budget performance est un trait produit.
- Les publiants saisissent le soir, sur téléphone : formulaire rapide, seuls nom + type + județ obligatoires, tout le reste optionnel (= « non renseigné »).
- Facebook est la source de trafic ; `/animal/[id]` doit offrir un chemin évident vers `/animale`.
- **Contact V1 (décidé)** : bouton d'appel `tel:` en action principale sur la fiche + les autres moyens renseignés dans le profil du publiant (email public, etc.) en secondaire.

## Capabilities and Constraints

- Stack existant : Next 16 (App Router), Tailwind 4, Better Auth (email + Google), Prisma 7 + Neon, Vercel Blob (photos compressées côté client).
- Routes : `/` (présentation + 2 boutons), `/animale` (liste + filtres — le vrai produit), `/animal/[id]` (fiche, entrée principale), `/adoptati` (« Și-au găsit o familie »), `/despre`, `/login`, `/inregistrare`, `/cont`, `/cont/profil`.
- Modèle Animal : type/sexe/âge/taille/județ/ville/description ; booléens sterilized, vaccinated, microchipped, goodWithKids/Dogs/Cats ; purpose ADOPTION|FOSTER non affiché en V1 ; table AnimalPhoto (1 photo affichée en V1, 4 possibles plus tard).
- **Rejeté — ne pas rouvrir** : perdus/trouvés, carte, favoris, alertes, vidéos, brouillons, page d'accueil séparée avec bouton vers la liste, renommage en Petly.
- **Décisions ouvertes** : terme roumain pour « foster » (familie temporară ?) ; mentions légales P7 (décharge type PetHive) ; achat de takemehome.ro ; recrutement de 2-3 sauveteurs testeurs.

## Brand Commitments

- Nom : **TakeMeHome** — gelé jusqu'au lancement, ne pas rouvrir. Domaine visé : takemehome.ro.
- Identité visuelle (palette, typographie, logo, règles d'usage) : **décisions prises et gelées** dans `design-idees.md`, consignées dans DESIGN.md. Ne pas rediscuter.
- Photos : en production, uniquement celles des publiants ; jamais de stock ni d'images décoratives sur les fiches ; **jamais d'images d'animaux générées par IA**. Sans photo : aplat crème + nom de l'animal en grand.

## Evidence on Hand

- `design-idees.md` à la racine : décisions gelées (nom, palette, typo, logo, politique photos, architecture, rejets).
- Pas encore de vraies photos : dev P5 sur Unsplash/Pexels (sans visages humains reconnaissables) ; validation P6 prévue avec 10 vraies photos de l'amie, y compris les mauvaises ; test P4 avec une photo prise au téléphone du porteur du projet.
- Aucun témoignage, chiffre ou presse — ne rien fabriquer.

## Product Principles

1. **La fiche est la vitrine** : tout s'optimise pour quelqu'un qui arrive de Facebook et doit pouvoir appeler en un geste.
2. **Publier doit tenir en quelques minutes, le soir, sur téléphone** : la friction côté publiants est l'ennemi n°1 du succès V1.
3. **Les vraies photos, même ratées, sont la vérité du produit** : l'interface doit flatter des photos amateur, pas les masquer.
4. **La performance en 4G est une fonctionnalité** : pages légères, une seule police variable, images compressées.
5. **Terminologie neutre pour les publiants** : bénévoles et associations partagent le même compte et les mêmes mots.

## Accessibility & Inclusion

- Diacritiques roumains à virgule souscrite (ș ț) partout, validés dans la police retenue.
- Contraste : le gris secondaire #6B625A sur crème doit tenir 4.5:1 (à vérifier) ; le bouton d'appel doit rester visible **à côté d'une photo de chien fauve**, pas seulement sur fond blanc.
- Cibles tactiles ≥ 44 px ; rien qui dépende du survol de souris.
