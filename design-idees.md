# TakeMeHome — décisions

## Nom
TakeMeHome — GELÉ jusqu'au lancement. Ne pas rouvrir.
Domaine : takemehome.ro (à acheter, .com indisponible et sans importance)

## Palette
Fond          #F7F3EA   crème
Cartes        #FFFDF8   blanc cassé
Texte         #2B2622   noir chaud
Secondaire    #6B625A   gris chaud   [vérifier contraste 4.5:1 sur crème]
Accent        #C4552F   terracotta — boutons + logo UNIQUEMENT
Adopté        #2F6B4F   vert forêt — pastille pleine, texte blanc

Règle : UN SEUL bouton plein par écran. Les autres en bordure terracotta.

## Typographie
Interface : Plus Jakarta Sans (Google Fonts, variable, via next/font)
            OK diacritiques roumains validés (virgule souscrite)
            A TESTER : le "1" à 14px sur téléphone
Une seule police variable — pas de second poids importé (CLS).

## Logo
V1 : "takemehome" bas de casse, Plus Jakarta Sans 800,
     letter-spacing -0.04em + patte simple #C4552F
Post-lancement : piste pattent un toit.
Règle : UNE forme, DEUX lectures. Lisible à 16x16 px.
Rejeté : cœur + patte (cliché, 4 formes, illisible en petit).

## Photos
Production : uniquement celles des sauveteurs. Aucune image de stock
             ni décorative sur les fiches.
Dev P5 : Unsplash/Pexels, sans visages humains reconnaissables.
Validation P6 : 10 vraies photos de l'amie, y compris les mauvaises.
Test P4 : photo prise avec MON téléphone (taille réelle).
Jamais : images d'animaux générées par IA.
Cartes : format fixe, object-fit cover, recadrage centré.
Sans photo : aplat crème + nom de l'animal en grand.

## Architecture
/              Présentation + 2 boutons -> /animale et /inregistrare
/animale       Liste + filtres (le vrai produit)
/animal/[id]   Fiche — PAGE D'ENTREE PRINCIPALE (liens Facebook)
               -> doit avoir un chemin évident vers /animale
/adoptati      « Si-au gasit o familie »
/despre        A propos
/login /inregistrare /cont /cont/profil

## A ajouter en P3
Animal : + size (SM)
         + sterilized, vaccinated, microchipped (booléens)
         + goodWithKids, goodWithDogs, goodWithCats (booléens)
         + purpose (ADOPTION | FOSTER, défaut ADOPTION) — non affiché en V1
Table AnimalPhoto (animalId, url, position) au lieu de Animal.photoUrl
-> une seule photo affichée en V1, 4 possibles plus tard sans migration

## Rejeté (ne pas rouvrir)
Perdus/trouvés · carte · favoris · alertes · vidéos · brouillons
Page d'accueil séparée avec bouton vers la liste
Renommage en Petly (marque encombrée, préfixe Pet- = PetHive)

## En attente
- Achat de takemehome.ro (père + pièce d'identité, NIS2)
- Réponses de l'amie : moyen de contact préféré, nombre d'animaux
- 2-3 autres sauveteurs prêts à tester
- Terme roumain pour "foster" (familie temporara ?)
- Mentions légales P7 (décharge de responsabilité type PetHive)
