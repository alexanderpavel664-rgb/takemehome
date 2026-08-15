import type {
  AgeGroup,
  AnimalSize,
  AnimalStatus,
  AnimalType,
  Sex,
} from "@/generated/prisma/client";

/**
 * Toutes les chaînes visibles du site, en roumain, dans un seul fichier :
 * les relectures se font ici, et un éventuel multilingue partirait d'ici.
 *
 * Règles d'écriture (PRODUCT.md / DESIGN.md — « De la om la om ») :
 * - tutoiement partout, ton chaleureux et direct, jamais institutionnel ;
 * - court : chaque phrase doit sonner comme écrite par quelqu'un de pressé
 *   qui connaît son sujet — pas de tiret cadratin en ponctuation, pas de
 *   formule creuse, pas d'emphase décorative ;
 * - diacritiques roumains corrects uniquement : ș/ț à virgule souscrite
 *   (U+0219/U+021B), jamais les formes cédille turques (U+015F/U+0163) ;
 * - guillemets roumains „…” ; pourcentage collé au nombre (45%) ; unités
 *   MB/KB avec virgule décimale ;
 * - états d'attente : « Se + verbe » quand l'action se décrit naturellement
 *   (Se salvează…, Se încarcă…), « Un moment… » pour les actions de session ;
 * - jamais « adăpost », « asociație » ou « salvator » seuls pour désigner
 *   qui publie : un seul type de compte couvre refuges, associations et
 *   bénévoles — on décrit l'action (« persoana care îl are în grijă »,
 *   « publicat de… »), pas le statut.
 */
export const STR = {
  /* ——— Marque. ——— */
  site: {
    name: "TakeMeHome",
  },

  /* ——— Libellés d'affichage des enums (les valeurs en base restent en
         anglais). Accord au masculin : ils qualifient « animalul ». ——— */
  enums: {
    type: {
      DOG: "Câine",
      CAT: "Pisică",
      OTHER: "Altul",
    } satisfies Record<AnimalType, string>,
    sex: {
      MALE: "Mascul",
      FEMALE: "Femelă",
    } satisfies Record<Sex, string>,
    ageGroup: {
      BABY: "Pui",
      YOUNG: "Tânăr",
      ADULT: "Adult",
      SENIOR: "Senior",
    } satisfies Record<AgeGroup, string>,
    size: {
      SMALL: "Talie mică",
      MEDIUM: "Talie medie",
      LARGE: "Talie mare",
    } satisfies Record<AnimalSize, string>,
    status: {
      AVAILABLE: "Disponibil",
      ADOPTED: "Adoptat",
    } satisfies Record<AnimalStatus, string>,
  },

  /* ——— En-tête, pied de page, coquilles. ——— */
  header: {
    homeAriaLabel: "Acasă",
    myAccount: "Contul meu",
    signIn: "Intră în cont",
  },
  footer: {
    ariaLabel: "Subsolul paginii",
    adopted: "Animale adoptate",
    about: "Despre",
  },

  /* ——— Page d'accueil. ——— */
  home: {
    // Descriptive, pas un slogan — et sans désigner un statut : les animaux
    // viennent de refuges comme de bénévoles.
    tagline: "Animale salvate din toată România, gata să fie adoptate.",
    metaTitle: "TakeMeHome – animale de adoptat din România",
    metaDescriptionSuffix:
      "Caută, găsește-l pe cel potrivit și sună direct persoana care îl are în grijă.",
    adoptCta: "Adoptă un animal",
    giveCta: "Dă spre adopție",
    howItWorks: "Cum funcționează",
    steps: [
      "Caută printre animalele de lângă tine.",
      "Găsește-l pe cel potrivit.",
      "Sună direct persoana care îl are în grijă.",
    ],
    theyWait: "Ei își așteaptă familia",
    seeAll: "Vezi toate animalele →",
  },

  /* ——— Liste publique /animale. ——— */
  animale: {
    metaTitle: "Animale de adoptat – TakeMeHome",
    metaDescription:
      "Câini, pisici și alte animale de adoptat din România, publicate de oamenii care le-au luat în grijă.",
    title: "Animale de adoptat",
    emptyTitle: "Niciun animal deocamdată",
    emptyDescription: "Revino curând.",
    noResultsTitle: "Niciun animal nu se potrivește cu filtrele alese",
    clearFilters: "Resetează filtrele",
    tabsAriaLabel: "Tipul animalului",
    tabs: {
      all: "Toate",
      DOG: "Câini",
      CAT: "Pisici",
      OTHER: "Altele",
    },
  },

  /* ——— Panneau de filtres (sheet mobile + colonne desktop). ——— */
  filters: {
    title: "Filtre",
    open: "Filtrează",
    close: "Închide",
    apply: "Aplică",
    // Court : à 360 px, le pied du sheet met « Resetează » et « Aplică »
    // côte à côte dans ~162 px chacun.
    reset: "Resetează",
    county: "Județ",
    // « Toată România » : plus parlant qu'un « Toate » sec pour un județ.
    countyAll: "Toată România",
    age: "Vârstă",
    sex: "Sex",
    size: "Talie",
    // « Indiferent » — l'usage des filtres roumains (OLX & co) pour
    // « peu importe ».
    any: "Indiferent",
    otherCriteria: "Alte criterii",
    sterilized: "Sterilizat",
    vaccinated: "Vaccinat",
    microchipped: "Microcipat",
    // Forme verbale, invariable en genre — les annonces réelles disent
    // « se înțelege cu alți câini », jamais « cu câinii ». Une seule forme
    // partout : filtres, fiche, formulaire.
    goodWithKids: "Se înțelege cu copiii",
    goodWithDogs: "Se înțelege cu alți câini",
    goodWithCats: "Se înțelege cu pisicile",
  },

  /* ——— Fiche publique /animal/[id]. ——— */
  animal: {
    notFoundMetaTitle: "Animalul nu a fost găsit – TakeMeHome",
    metaDescription: (name: string) => `${name} își așteaptă familia.`,
    backToList: "← Toate animalele",
    adoptedBadge: "Adoptat",
    alreadyAdopted: "Acest animal și-a găsit deja familia.",
    seeAvailable: "Vezi animalele de adoptat",
    call: "Sună",
    // Court : dans la barre fixe à 360 px, « Trimite un email » casserait
    // sur deux lignes à côté de « Sună ».
    email: "Email",
    description: "Descriere",
    health: "Sănătate",
    goodWith: "Se înțelege cu",
    goodWithKids: "copiii",
    goodWithDogs: "alți câini",
    goodWithCats: "pisicile",
    sterilized: "Sterilizat",
    vaccinated: "Vaccinat",
    microchipped: "Microcipat",
    // false en base = non renseigné, pas « non » : la fiche n'affiche que
    // les certitudes, et le dit avec chaleur.
    notSpecified: "Nu știm încă",
    publishedBy: (name: string) => `Publicat de ${name}`,
    updated: (relative: string) => `Actualizat ${relative}`,
    photoAlt: (name: string) => `Fotografie cu ${name}`,
    notFoundTitle: "Animalul nu a fost găsit",
    notFoundDescription: "Anunțul nu mai există sau a fost retras.",
  },

  /* ——— /adoptati. ——— */
  adoptati: {
    metaTitle: "Și-au găsit familia – TakeMeHome",
    metaDescription: "Animalele care și-au găsit familia prin TakeMeHome.",
    title: "Și-au găsit familia",
    emptyTitle: "Încă niciun animal adoptat",
    emptyDescription: "Cum își găsește un animal familia, apare aici.",
  },

  /* ——— /despre. ——— */
  despre: {
    metaTitle: "Despre – TakeMeHome",
    metaDescription:
      "Anunțuri de adopție pentru animale salvate din România. Filtrezi după județ, vârstă sau talie și suni direct persoana care are animalul în grijă.",
    title: "Despre",
    p1: "TakeMeHome adună anunțurile de adopție ale animalelor salvate din România. Le poți filtra după tip, județ, vârstă sau talie, și rămân la zi: un animal adoptat e marcat ca atare.",
    // L'énumération est complète (bénévole, association, refuge) : elle ne
    // réduit personne à un statut unique.
    p2: "Fiecare anunț e publicat de persoana care are animalul în grijă: un voluntar, o asociație sau un adăpost. Un telefon e de ajuns.",
    p3BeforeLink: "Ai în grijă un animal care își caută o familie? ",
    p3Link: "Creează-ți un cont",
    p3AfterLink: " și publică-i anunțul.",
    seeAnimals: "Vezi animalele",
  },

  /* ——— Authentification. ——— */
  auth: {
    login: {
      metaTitle: "Intră în cont – TakeMeHome",
      title: "Intră în cont",
      email: "Email",
      password: "Parolă",
      submit: "Intră în cont",
      submitPending: "Un moment…",
      google: "Continuă cu Google",
      googleFailed: "Conectarea cu Google nu a reușit. Încearcă din nou.",
      noAccount: "Nu ai cont încă?",
      createAccount: "Creează-ți un cont",
    },
    register: {
      metaTitle: "Creează-ți un cont – TakeMeHome",
      title: "Creează-ți un cont",
      name: "Nume",
      email: "Email",
      password: "Parolă (cel puțin 8 caractere)",
      submit: "Creează contul",
      submitPending: "Se creează contul…",
      hasAccount: "Ai deja un cont?",
      signIn: "Intră în cont",
    },
    errors: {
      INVALID_EMAIL_OR_PASSWORD: "Email sau parolă greșită.",
      INVALID_EMAIL: "Adresa de email nu e validă.",
      PASSWORD_TOO_SHORT: "Parola trebuie să aibă cel puțin 8 caractere.",
      PASSWORD_TOO_LONG: "Parola e prea lungă (cel mult 128 de caractere).",
      USER_ALREADY_EXISTS: "Există deja un cont cu această adresă de email.",
      USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
        "Există deja un cont cu această adresă de email.",
      fallback: "Ceva n-a mers bine. Încearcă din nou.",
    },
  },

  /* ——— Espace compte /cont. ——— */
  cont: {
    metaTitle: "Contul meu – TakeMeHome",
    title: "Contul meu",
    confirmationCreated: "Anunțul a fost publicat.",
    confirmationUpdated: "Modificările au fost salvate.",
    profileTitle: "Profilul meu",
    edit: "Modifică",
    profileName: "Nume",
    profileAccountEmail: "Emailul contului",
    profilePhone: "Telefon",
    profilePublicEmail: "Email public",
    profileCounty: "Județ",
    notFilled: "necompletat",
    unreachableWarning:
      "Fără telefon sau email public, nimeni nu te poate contacta pentru adopție. Completează măcar unul în profil.",
    myAnimals: "Animalele mele",
    addAnimal: "Adaugă un animal",
    emptyTitle: "Niciun animal deocamdată",
    emptyDescription: "Adaugă primul tău animal cu butonul de mai sus.",
    updated: (relative: string) => `Actualizat ${relative}`,
    seePublicListing: "Vezi anunțul public",
    markAdopted: "Marchează ca adoptat",
    markAvailable: "Marchează ca disponibil",
    delete: "Șterge",
    deleteConfirm: (name: string) =>
      `Ștergi anunțul pentru ${name}? Nu se mai poate recupera.`,
    signOut: "Ieși din cont",
    signOutPending: "Un moment…",
    install: {
      title: "Instalează TakeMeHome",
      ios: {
        // Les libellés cités sont ceux de l'écran : Apple vouvoie dans sa
        // localisation roumaine (« Partajați », « Adăugați… »).
        before: "În Safari, deschide meniul „Partajați” și alege ",
        highlight: "„Adăugați la ecranul principal”",
        after: ".",
      },
      description:
        "Aplicația se deschide de pe ecranul principal, fără browser.",
      install: "Instalează",
      dismiss: "Nu, mulțumesc",
    },
  },

  /* ——— /cont/profil. ——— */
  profil: {
    metaTitle: "Profilul meu – TakeMeHome",
    title: "Profilul meu",
    intro: "Aceste informații apar ca date de contact pe anunțurile tale.",
    name: "Nume",
    phone: "Telefon",
    publicEmail: "Email public de contact",
    county: "Județ",
    countyPlaceholder: "Alege județul",
    city: "Localitate",
    description: "Descriere",
    nameRequired: "Numele e obligatoriu.",
    saveFailed: "Salvarea nu a reușit. Încearcă din nou.",
    saved: "Profilul a fost salvat.",
    save: "Salvează",
    savePending: "Se salvează…",
    backToAccount: "Înapoi la cont",
  },

  /* ——— Formulaire animal (création + édition). ——— */
  animalForm: {
    newMetaTitle: "Adaugă un animal – TakeMeHome",
    newTitle: "Adaugă un animal",
    newSubmit: "Publică anunțul",
    editMetaTitle: "Modifică anunțul – TakeMeHome",
    editTitle: (name: string) => `Modifică anunțul pentru ${name}`,
    // « Salvează » seul, si près d'un animal, se lirait « sauve-le » —
    // la forme longue lève l'ambiguïté.
    editSubmit: "Salvează modificările",
    cancel: "Renunță",
    name: "Nume *",
    type: "Tip *",
    typePlaceholder: "Alege",
    sex: "Sex",
    age: "Vârstă",
    ageText: "Vârsta exactă",
    ageTextPlaceholder: "de ex. 2 ani",
    county: "Județ *",
    countyPlaceholder: "Alege județul",
    city: "Localitate",
    description: "Descriere",
    photo: "Fotografie",
    health: "Sănătate",
    sterilized: "Sterilizat",
    vaccinated: "Vaccinat",
    microchipped: "Microcipat",
    goodWith: "Se înțelege cu",
    // La légende se termine par « cu » : les puces la continuent, article
    // défini compris (« cu copiii », jamais « cu copii »).
    goodWithKids: "Copiii",
    goodWithDogs: "Alți câini",
    goodWithCats: "Pisicile",
    size: "Talie",
    status: "Status",
    notSpecified: "Nespecificat",
    notSpecifiedFeminine: "Nespecificată",
    // Erreurs de validation côté serveur, une par champ.
    nameRequired: "Numele e obligatoriu.",
    typeRequired: "Tipul animalului e obligatoriu.",
    countyRequired: "Județul e obligatoriu.",
    photoUrlInvalid: "Adresa fotografiei nu e validă.",
    // Photo : sélection, préparation, envoi.
    notAnImage: "Fișierul nu e o imagine. Alege o fotografie.",
    fileTooLarge: (size: string) =>
      `Fișierul e prea mare (${size}, cel mult 25 MB). Alege altă fotografie.`,
    preparingFailed: "Fotografia nu s-a putut pregăti.",
    preparing: "Se pregătește fotografia…",
    previewAlt: "Previzualizarea fotografiei alese",
    photoReady: (format: string, sizes: string) =>
      `Fotografia e gata (${format}${sizes}). Se trimite când salvezi.`,
    currentPhotoAlt: "Fotografia actuală",
    currentPhotoHint: "Fotografia actuală. Dacă alegi alt fișier, o înlocuiește.",
    uploading: (percent: number) => `Se trimite fotografia… ${percent}%`,
    uploadingLabel: "Se trimite fotografia…",
    uploadNetworkError: "Fotografia nu s-a trimis: problemă de rețea. Încearcă din nou.",
    uploadError: (message: string) => `Fotografia nu s-a trimis: ${message}`,
    saving: "Se salvează…",
  },

  /* ——— Erreurs de compression photo (côté navigateur). ——— */
  compress: {
    unsupportedFormat:
      "Formatul imaginii nu e acceptat. Alege un JPEG, PNG sau WebP.",
    unreadable: "Imaginea nu poate fi citită.",
    cannotPrepare: "Fotografia nu s-a putut pregăti pe acest dispozitiv.",
    compressionFailed: "Fotografia nu s-a putut comprima pe acest dispozitiv.",
  },

  /* ——— API d'upload (messages renvoyés au navigateur). ——— */
  upload: {
    signInRequired: "Intră în cont ca să trimiți o fotografie.",
    pathNotAllowed: "Cale de fotografie neautorizată.",
    animalNotFound: "Animalul nu a fost găsit.",
    unknownError: "Eroare necunoscută.",
    invalidStatus: "Status invalid.",
  },

  /* ——— 404, hors ligne, chargement. ——— */
  notFound: {
    title: "Pagina nu a fost găsită",
    description: "Linkul e greșit sau pagina nu mai există.",
    cta: "Vezi animalele de adoptat",
  },
  offline: {
    metaTitle: "Fără internet – TakeMeHome",
    title: "Fără internet",
    description:
      "Nu păstrăm anunțurile offline: ai putea vedea un animal deja adoptat. Revino când ai semnal.",
  },
  common: {
    loading: "Se încarcă…",
    seeMore: "Vezi mai multe",
    justNow: "chiar acum",
  },

  /* ——— Métadonnées globales (layout racine, manifest PWA). ——— */
  meta: {
    rootTitle: "TakeMeHome – animale din România care își caută o familie",
    rootDescription:
      "Anunțuri de adopție pentru animale salvate din România. Filtrezi după județ, vârstă sau talie și suni direct persoana care are animalul în grijă.",
  },
} as const;
