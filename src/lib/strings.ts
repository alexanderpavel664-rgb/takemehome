import type {
  AgeGroup,
  AnimalSize,
  AnimalStatus,
  AnimalType,
  ReportReason,
  ReportStatus,
  Sex,
} from "@/generated/prisma/client";
import { CONTACT_EMAIL } from "@/lib/site";

/**
 * Accord roumain du nom après un nombre : « 1 semnalare », « 3 semnalări »,
 * mais « 20 DE semnalări » — la préposition apparaît dès que les deux
 * derniers chiffres valent 00 ou 20 et plus.
 */
export function countRo(n: number, one: string, many: string): string {
  if (n === 1) {
    return `1 ${one}`;
  }
  const rest = n % 100;
  return `${n}${rest === 0 || rest >= 20 ? " de" : ""} ${many}`;
}

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
      // Fratrie mélangée — proposé seulement quand l'annonce compte
      // plusieurs animaux ; jamais un filtre.
      MIXED: "Mixt",
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
      // Masqué faute de confirmation (lib/confirmations.ts) : jamais dans
      // le sélecteur du formulaire, seulement dans /cont.
      UNCONFIRMED: "Inactiv",
    } satisfies Record<AnimalStatus, string>,
    // Motifs de signalement — l'ordre du formulaire public suit celui-ci.
    reportReason: {
      FALSE_INFO: "Informații false",
      ALREADY_ADOPTED: "Animalul e deja adoptat",
      INAPPROPRIATE: "Conținut nepotrivit",
      SCAM: "Suspiciune de înșelătorie",
      OTHER: "Altceva",
    } satisfies Record<ReportReason, string>,
    // Vus uniquement dans /admin.
    reportStatus: {
      PENDING: "În așteptare",
      REVIEWED: "Tratat",
      DISMISSED: "Respins",
    } satisfies Record<ReportStatus, string>,
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
    // Sur toutes les coquilles, y compris le compte et la modération.
    // Le contenu des deux pages vit dans lib/legal.ts, pas ici : voir
    // l'en-tête de ce fichier-là.
    privacy: "Confidențialitate",
    terms: "Termeni",
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

  /* ——— Pages par județ (SEO) : /caini-de-adoptat/[judet] et
         /pisici-de-adoptie/[judet]. Les titres reprennent les mots que les
         gens tapent (« câini de adoptat Cluj », « pisici de adopție »), avec
         les diacritiques : Google les rapproche des recherches sans. ——— */
  judet: {
    title: {
      DOG: (place: string) => `Câini de adoptat în ${place}`,
      CAT: (place: string) => `Pisici de adopție în ${place}`,
    },
    // `n` = nombre d'animaux (somme des fratries), jamais d'annonces.
    description: {
      DOG: (n: number, place: string) =>
        `${countRo(n, "câine", "câini")} din ${place} își caută o familie. Vezi fotografiile și sună direct persoana care are animalul în grijă.`,
      CAT: (n: number, place: string) =>
        `${countRo(n, "pisică", "pisici")} din ${place} își caută o familie. Vezi fotografiile și sună direct persoana care are animalul în grijă.`,
    },
    seeAllCounty: (place: string) => `Toate animalele din ${place} →`,
    // Le bloc de liens sous la grille de /animale et des pages județ.
    navLabel: "Animale de adoptat pe județe",
    linksTitle: {
      DOG: "Câini de adoptat pe județe",
      CAT: "Pisici de adopție pe județe",
    },
    link: (county: string, n: number) => `${county} (${n})`,
  },

  /* ——— Favoris : stockés dans le navigateur seulement (localStorage),
         sans compte ni donnée en base. ——— */
  favorite: {
    // Libellé constant + aria-pressed : un bouton bascule ne change pas de
    // nom, c'est son état qui dit s'il est enfoncé.
    toggle: "Salvează la favorite",
    toggleNamed: (name: string) => `Salvează la favorite: ${name}`,
    headerLink: (n: number) => (n > 0 ? `Favorite (${n})` : "Favorite"),
    metaTitle: "Favorite – TakeMeHome",
    title: "Favorite",
    intro: "Animalele pe care le-ai salvat. Rămân doar în acest browser, fără cont.",
    emptyTitle: "Niciun animal salvat",
    emptyDescription: "Apasă inima de pe un anunț și îl găsești aici.",
    // Annonce supprimée ou retirée : elle sort des favoris, et on le dit —
    // sinon la personne cherche l'animal qu'elle avait gardé.
    removed: (n: number) =>
      n === 1
        ? "Un anunț salvat nu mai e publicat și a fost scos din favorite."
        : `${countRo(n, "anunț salvat", "anunțuri salvate")} nu mai sunt publicate și au fost scoase din favorite.`,
    loadFailed: "Favoritele nu s-au putut încărca. Verifică internetul și încearcă din nou.",
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
    dewormed: "Deparazitat",
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
    // `subject` : le nom, ou ce qui en tient lieu (animalSubject dans
    // lib/animal-display.ts) — « Fulga », « 3 pui », « Un cățel ». Le
    // verbe a la même forme au singulier et au pluriel.
    metaDescription: (subject: string) => `${subject} își așteaptă familia.`,
    /* ——— Sans nom. Le mot tient lieu de nom, en Display comme un vrai :
       singulier pour un animal, pluriel pour une fratrie. Avec l'article
       quand il ouvre une phrase (« Un cățel caută o familie »), sinon la
       phrase sonne comme un titre. ——— */
    unnamed: {
      DOG: "Cățel",
      CAT: "Pisică",
      OTHER: "Animal",
    } satisfies Record<AnimalType, string>,
    unnamedPlural: {
      DOG: "Căței",
      CAT: "Pisici",
      OTHER: "Animale",
    } satisfies Record<AnimalType, string>,
    unnamedSubject: {
      DOG: "Un cățel",
      CAT: "O pisică",
      OTHER: "Un animal",
    } satisfies Record<AnimalType, string>,
    /* ——— Fratries : « 3 pui », « 2 câini », « 20 de pisici » (accord
       countRo). « pui » dès que l'annonce dit Pui, sinon le mot du type. ——— */
    groupBaby: ["pui", "pui"] as const,
    groupByType: {
      DOG: ["câine", "câini"],
      CAT: ["pisică", "pisici"],
      OTHER: ["animal", "animale"],
    } satisfies Record<AnimalType, readonly [string, string]>,
    mustStayTogether: "Se adoptă împreună",
    // Échéance : « Până la 15 sept. » sur la carte, « Până la 15 septembrie »
    // sur la fiche — la date, jamais le mot « urgent » (il ne veut plus rien
    // dire dès que tout le monde peut l'écrire).
    until: (date: string) => `Până la ${date}`,
    /* ——— Partage : le menu natif du téléphone (Facebook, WhatsApp,
       Messenger, SMS), sinon le lien copié. ——— */
    share: "Distribuie",
    shareText: (subject: string) => `${subject} caută o familie`,
    linkCopied: "Link copiat",
    shareFailed: "Nu s-a putut copia linkul",
    backToList: "← Toate animalele",
    adoptedBadge: "Adoptat",
    alreadyAdopted: "Acest animal și-a găsit deja familia.",
    alreadyAdoptedPlural: "Aceste animale și-au găsit deja familia.",
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
    dewormed: "Deparazitat",
    microchipped: "Microcipat",
    // false en base = non renseigné, pas « non » : la fiche n'affiche que
    // les certitudes, et le dit avec chaleur.
    notSpecified: "Nu știm încă",
    publishedBy: (name: string) => `Publicat de ${name}`,
    updated: (relative: string) => `Actualizat ${relative}`,
    photoAlt: (name: string) => `Fotografie cu ${name}`,
    /* ——— Carrousel de la fiche (plusieurs photos). ——— */
    photosLabel: (name: string) => `Fotografii cu ${name}`,
    photoPosition: (i: number, n: number) => `Fotografia ${i} din ${n}`,
    photoCounter: (i: number, n: number) => `${i} / ${n}`,
    previousPhoto: "Fotografia anterioară",
    nextPhoto: "Fotografia următoare",
    notFoundTitle: "Animalul nu a fost găsit",
    notFoundDescription: "Anunțul nu mai există sau a fost retras.",
    // Lien discret en bas de fiche : pas un bouton, pas une alerte — juste
    // une porte, visible pour tous ; sans compte, elle passe par /login.
    report: "Semnalează acest anunț",
    // Annonce masquée par la modération : seul son propriétaire (et un
    // ADMIN) arrive jusqu'ici, tout le monde d'autre reçoit un 404. Deux
    // causes, deux phrases : une suspension masque toutes les annonces du
    // compte d'un coup — dire « după o semnalare » à quelqu'un dont le
    // compte vient d'être suspendu l'enverrait chercher une semnalare qui
    // n'existe pas. « Modificările nu îl readuc » : sans cette phrase, la
    // publiante modifie, resauvegarde, et attend un retour qui ne vient pas.
    hiddenTitle: "Anunțul e ascuns",
    hiddenDescription:
      "Echipa TakeMeHome l-a ascuns după o semnalare. Nu mai apare în paginile publice și doar tu îl mai vezi. Modificările pe care le faci nu îl readuc.",
    hiddenDescriptionSuspended:
      "E ascuns cât timp contul tău e suspendat. Nu apare în paginile publice și doar tu îl mai vezi.",
    // Partage Facebook d'une fiche adoptée : l'aperçu le dit avant le clic.
    // Seul verbe qui change de forme au pluriel (« Rex și Nala și-au… »).
    adoptedMetaDescription: (subject: string, plural: boolean) =>
      `${subject} ${plural ? "și-au" : "și-a"} găsit deja familia. Vezi celelalte animale de adoptat.`,
    // Annonce masquée faute de confirmation : la fiche reste en ligne pour
    // un lien déjà partagé, avec un message neutre. On dit ce qu'on sait
    // (personne n'a confirmé), pas ce qu'on suppose (adopté).
    //
    // Le titre de la fiche et la pastille d'un favori inactif sur /favorite
    // disent la même chose, l'une en court : la pastille doit tenir sur une
    // ligne dans une carte de 360 px (grille 2 colonnes). Jamais « Inactiv »,
    // un mot de publiant. Changer l'un, c'est changer l'autre.
    unconfirmedTitle: "Anunțul nu mai e activ",
    unconfirmedBadge: "Nu mai e activ",
    unconfirmed: "Persoana care l-a publicat nu a confirmat recent că animalul e încă disponibil.",
    unconfirmedPlural:
      "Persoana care l-a publicat nu a confirmat recent că animalele sunt încă disponibile.",
    unconfirmedMetaDescription:
      "Anunțul nu mai e activ. Vezi celelalte animale de adoptat.",
    /* ——— Coordonnées en toutes lettres. Sur un ordinateur, tel: ne fait
       rien d'utile : le numéro doit se lire et se copier. ——— */
    contactTitle: "Contact",
    // Publiant sans contact affiché (lib/contact-status.ts) : à la place de
    // la carte Contact, sous le même titre. On dit ce qu'on sait, sans
    // reproche ; « încă » parce que ça peut changer — la fiche redevient
    // joignable dès que le profil est complété.
    noContact: "Persoana care a publicat anunțul nu a lăsat încă date de contact.",
    phoneLabel: "Telefon",
    emailLabel: "Email",
    copy: "Copiază",
    copied: "Copiat",
    copyFailed: "Nu s-a putut copia",
    copyPhone: "Copiază numărul de telefon",
    copyEmail: "Copiază adresa de email",
  },

  /* ——— « A fost deja adoptat? » en bas de fiche, sans compte. Ne change
         rien à l'annonce : demande au publiant de confirmer (l'email part
         avec la tâche du lendemain matin). ——— */
  adoptionSignal: {
    button: "A fost deja adoptat?",
    pending: "Se trimite…",
    sent: "Mulțumim. Îi cerem persoanei care l-a publicat să confirme.",
    tooManyRequests:
      "Prea multe cereri într-un minut. Încearcă din nou puțin mai târziu.",
    failed: "Nu s-a putut trimite. Încearcă din nou.",
  },

  /* ——— Signalement d'une annonce (/animal/[id]/semnaleaza). ——— */
  report: {
    metaTitle: "Semnalează un anunț – TakeMeHome",
    title: (name: string) => `Semnalezi anunțul pentru ${name}`,
    // Pas un mot sur le compte : qui lit ceci en a un, la page l'a exigé.
    intro: "Citim fiecare semnalare și verificăm anunțul.",
    reason: "Motiv *",
    reasonPlaceholder: "Alege motivul",
    message: "Detalii (opțional)",
    messagePlaceholder: "Ce anume te-a făcut să semnalezi anunțul?",
    submit: "Trimite semnalarea",
    submitPending: "Se trimite…",
    back: "Înapoi la anunț",
    reasonRequired: "Alege un motiv.",
    messageTooLong: "Detaliile sunt prea lungi (cel mult 1000 de caractere).",
    tooManyRequests:
      "Prea multe semnalări. Așteaptă un minut și încearcă din nou.",
    saveFailed: "Semnalarea nu s-a putut trimite. Încearcă din nou.",
    // Confirmation : elle remplace le formulaire, et ne promet pas de
    // réponse individuelle — on ne tient que ce qu'on peut tenir.
    sentTitle: "Îți mulțumim",
    sentDescription:
      "Am primit semnalarea și ne uităm peste anunț. Nu primești un răspuns, dar fiecare semnalare e citită.",
  },

  /* ——— Modération /admin (jamais vue par un compte USER). ——— */
  admin: {
    metaTitle: "Moderare – TakeMeHome",
    title: "Moderare",
    pending: (n: number) =>
      `${countRo(n, "semnalare", "semnalări")} în așteptare`,
    emptyTitle: "Nicio semnalare",
    emptyDescription: "Când cineva semnalează un anunț, apare aici.",
    truncated: (n: number) =>
      `Se afișează cele mai recente ${countRo(n, "semnalare", "semnalări")}.`,
    seeAnimal: "Vezi anunțul",
    details: "Detalii",
    publishedBy: (name: string) => `Publicat de ${name}`,
    // Nom ET email : le nom seul ne distingue pas deux « Maria », et c'est
    // l'email qui permet de reconnaître un compte qui signale en série.
    reportedBy: (name: string, email: string) =>
      `Semnalat de ${name} (${email})`,
    hiddenBadge: "Anunț ascuns",
    suspendedBadge: "Cont suspendat",
    hide: "Ascunde anunțul",
    unhide: "Arată anunțul",
    suspend: "Suspendă contul",
    unsuspend: "Reactivează contul",
    // La réactivation ne réaffiche rien d'elle-même : une annonce masquée
    // l'a été après examen, la ressusciter en lot annulerait ce travail.
    suspendHint:
      "Suspendarea ascunde toate anunțurile contului. Reactivarea nu le readuce: le arăți unul câte unul.",
    confirmSuspend: (name: string) =>
      `Suspenzi contul „${name}”? Toate anunțurile lui se ascund, iar reactivarea nu le readuce.`,
    markReviewed: "Marchează tratat",
    dismiss: "Respinge",
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
    // Propre à la page : la description du layout racine, que reprennent
    // toutes les pages sans description, était aussi celle-ci.
    metaDescription:
      "Cine publică anunțurile pe TakeMeHome și câteva sfaturi ca să adopți în siguranță.",
    title: "Despre",
    p1: "TakeMeHome adună anunțurile de adopție ale animalelor salvate din România. Le poți filtra după tip, județ, vârstă sau talie, și rămân la zi: un animal adoptat e marcat ca atare.",
    // L'énumération est complète (bénévole, association, refuge) : elle ne
    // réduit personne à un statut unique.
    p2: "Fiecare anunț e publicat de persoana care are animalul în grijă: un voluntar, o asociație sau un adăpost. Un telefon e de ajuns.",
    p3BeforeLink: "Ai în grijă un animal care își caută o familie? ",
    p3Link: "Creează-ți un cont",
    p3AfterLink: " și publică-i anunțul.",
    seeAnimals: "Vezi animalele",
    // Ton informatif, jamais alarmiste : on décrit des habitudes, on
    // n'agite pas la peur. La première phrase pose la proportion réelle.
    //
    // Seul endroit du site où ces conseils existent : /termeni n'en donne
    // pas (un contrat définit des obligations, il ne conseille pas), il se
    // contente d'interdire ce que ces conseils apprennent à reconnaître.
    safetyTitle: "Cum adopți în siguranță",
    safetyIntro:
      "Cele mai multe anunțuri sunt reale. Câteva obiceiuri simple te ajută să le recunoști pe cele care nu sunt.",
    safetyTips: [
      "Vezi animalul în persoană înainte să te hotărăști.",
      "Întâlnește-te într-un loc public sau la adăpost, nu la o adresă pe care nu o cunoști.",
      "Ia-ți timp: cine te grăbește să decizi pe loc are de obicei un motiv.",
      "Nu trimite bani în avans, nici pentru transport, nici pentru „rezervare”.",
      "Cere carnetul de sănătate și istoricul: vaccinuri, sterilizare, tratamente. Un medic veterinar ți le poate confirma.",
      "Fotografiile care par prea profesioniste pot veni de oriunde de pe internet. Cere una făcută pe loc.",
    ],
    safetyReport:
      "Dacă un anunț ți se pare suspect, folosește „Semnalează acest anunț” din josul lui.",
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
      forgotPassword: "Ai uitat parola?",
    },
    /* ——— /parola-uitata : la demande de réinitialisation. ——— */
    forgotPassword: {
      metaTitle: "Parolă uitată – TakeMeHome",
      title: "Ai uitat parola?",
      intro:
        "Scrie adresa de email a contului. Îți trimitem un link cu care alegi o parolă nouă.",
      email: "Email",
      submit: "Trimite linkul",
      submitPending: "Se trimite…",
      // ACELAȘI text, indiferent dacă adresa are sau nu cont : altfel
      // pagina ar spune cine are cont pe site. Serverul răspunde la fel
      // (better-auth, /request-password-reset) — fraza de aici e singura
      // care ajunge pe ecran.
      sent: "Dacă adresa are un cont TakeMeHome, ai primit un email cu linkul. Verifică și dosarul spam: linkul e valabil o oră.",
      backToLogin: "Înapoi la conectare",
    },
    /* ——— /parola-noua : le nouveau mot de passe, depuis le lien. ——— */
    resetPassword: {
      metaTitle: "Parolă nouă – TakeMeHome",
      title: "Alege o parolă nouă",
      intro:
        "Celelalte sesiuni deschise cu contul tău se închid. Rămâi conectat aici.",
      newPassword: "Parola nouă (cel puțin 8 caractere)",
      confirmPassword: "Repetă parola nouă",
      submit: "Salvează parola",
      submitPending: "Se salvează…",
      // Link expirat, deja folosit sau greșit : un singur mesaj — cele trei
      // cazuri se rezolvă la fel, cu un link nou.
      invalidTitle: "Linkul nu mai e valabil",
      invalidDescription:
        "Linkul de resetare a expirat sau a fost deja folosit. Cere unul nou: e valabil o oră și se folosește o singură dată.",
      requestAgain: "Cere un link nou",
      // Parola s-a schimbat, dar conectarea automată a eșuat : nu pierde
      // nimic, se conectează cu parola nouă.
      changedSignInFailed:
        "Parola a fost schimbată, dar conectarea automată nu a reușit. Intră în cont cu parola nouă.",
      goToLogin: "Intră în cont",
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
      /* ——— Acceptation des conditions — la case, jamais pré-cochée. ——— */
      // Le libellé est découpé autour des deux liens : chacun mène au
      // document qu'il nomme, ouvert dans un autre onglet pour ne pas
      // perdre le formulaire.
      termsBefore: "Am citit și accept ",
      termsLink: "Termenii și condițiile",
      termsAnd: " și ",
      privacyLink: "Politica de confidențialitate",
      termsAfter: ".",
      termsRequired:
        "Bifează acceptarea termenilor ca să îți creezi contul.",
    },
    /* ——— /accepta-termenii : la porte des comptes sans acceptation. ——— */
    // Comptes créés avant cette règle, ou avec Google depuis /login (où il
    // n'y a pas de case) : l'espace compte les amène ici une fois.
    acceptTerms: {
      metaTitle: "Acceptă termenii – TakeMeHome",
      title: "Înainte să continui",
      intro:
        "Contul tău nu are încă înregistrată acceptarea termenilor. Ca să folosești contul, citește documentele de mai jos și bifează căsuța.",
      submit: "Continuă",
      submitPending: "Un moment…",
      // L'échec ici bloque l'accès au compte : la personne doit savoir que
      // ce n'est pas elle, quoi refaire, et à qui écrire si ça persiste.
      failed: `Acceptarea nu s-a putut salva, e o problemă de partea noastră. Încearcă din nou; dacă se repetă, scrie la ${CONTACT_EMAIL}.`,
    },
    errors: {
      INVALID_EMAIL_OR_PASSWORD: "Email sau parolă greșită.",
      INVALID_EMAIL: "Adresa de email nu e validă.",
      PASSWORD_TOO_SHORT: "Parola trebuie să aibă cel puțin 8 caractere.",
      PASSWORD_TOO_LONG: "Parola e prea lungă (cel mult 128 de caractere).",
      USER_ALREADY_EXISTS: "Există deja un cont cu această adresă de email.",
      USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
        "Există deja un cont cu această adresă de email.",
      // Changement de mot de passe.
      INVALID_PASSWORD: "Parola actuală e greșită.",
      CREDENTIAL_ACCOUNT_NOT_FOUND:
        "Contul tău nu are parolă: intri în cont cu Google.",
      // Reinițializarea parolei (/parola-noua) : jetonul consumat, expirat
      // sau necunoscut — better-auth nu le distinge, nici noi.
      INVALID_TOKEN:
        "Linkul de resetare a expirat sau a fost deja folosit. Cere unul nou.",
      // Limita de debit (429) : fereastra e de 15 minute — « câteva minute »
      // spune adevărul fără să promită un cronometru.
      rateLimited: "Prea multe încercări. Așteaptă câteva minute și încearcă din nou.",
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
    /* ——— Profil incomplet : le bloc en haut de /cont, de /cont/animal/nou
       et de /cont/animal/[id]/editare. ——— */
    // Le titre dit ce qui se passe (depuis octobre 2026, une annonce sans
    // contact sort des listes publiques), pas ce qu'il faut ressentir.
    // Dessous, le seul fait utile : ce qui la fera revenir — trois cas,
    // trois phrases, jamais fusionnées (« complète tes coordonnées » à
    // quelqu'un qui les a déjà remplies l'enverrait chercher un problème
    // qui n'existe pas). Ni phrase rassurante, ni justification : le lien,
    // qui mène droit à la section Date de contact du profil, suffit.
    contactWarning: {
      title: "Anunțurile tale nu sunt vizibile pe site",
      // Le cas le plus fréquent : inscription, publication, et rien d'autre.
      noContactNoConsent:
        "Devin vizibile imediat ce completezi telefonul sau emailul public și bifezi afișarea lor publică.",
      noContact: "Devin vizibile imediat ce completezi telefonul sau emailul public.",
      noConsent: "Devin vizibile imediat ce bifezi afișarea publică a datelor de contact.",
      action: "Completează profilul",
    },
    // Sur chaque fiche de la publiante, tant que le profil est incomplet :
    // la pastille encre pleine, celle des états qui comptent.
    noContactBadge: "Nevizibil: lipsesc datele de contact",
    // Fiche sans photo : une invitation, avec le fait qui la motive —
    // informative, jamais culpabilisante. La fiche est en ligne telle quelle.
    noPhotoHint:
      "Anunțul nu are fotografie. Anunțurile cu fotografie primesc mai multe cereri.",
    addPhoto: "Adaugă o fotografie",
    /* ——— Email non confirmé (n'apparaît qu'une fois l'envoi activé). ——— */
    verifyEmail: {
      title: "Confirmă-ți adresa de email",
      description: (email: string) =>
        `Ți-am trimis un email la ${email}. Deschide linkul din el ca să confirmi adresa.`,
      resend: "Retrimite emailul",
      resendPending: "Se trimite…",
      resent: "Emailul a fost retrimis. Verifică și dosarul spam.",
      resendFailed: "Emailul nu s-a putut trimite. Încearcă din nou.",
    },
    profileContactConsent: "Afișarea publică a datelor de contact",
    contactConsentOn: "bifată",
    contactConsentOff: "nebifată",
    // Compte suspendu : l'écran dit ce qui a changé, ce qui reste possible,
    // et à qui écrire — sans ces deux derniers, la personne croit à une
    // panne et réessaie. L'adresse est rendue en lien (ContactEmailLink),
    // d'où le libellé coupé en deux.
    suspendedTitle: "Contul e suspendat",
    suspendedDescription:
      "Echipa TakeMeHome ți-a suspendat contul. Nu mai poți publica sau modifica anunțuri, iar anunțurile tale nu mai apar în paginile publice.",
    suspendedCanStill: "Ce poți face în continuare:",
    suspendedCanStillList: [
      "să vezi anunțurile tale, așa cum sunt acum",
      "să ștergi anunțurile tale",
      "să îți ștergi contul, din pagina profilului",
    ],
    // Annonce masquée : le propriétaire la voit, marquée comme telle. Même
    // distinction que sur la fiche (animal.hiddenDescription*) : une
    // suspension masque tout le compte, ce n'est pas « după o semnalare ».
    hiddenBadge: "Ascuns",
    hiddenHint:
      "Nu apare în paginile publice: echipa TakeMeHome l-a ascuns după o semnalare.",
    hiddenHintSuspended:
      "Nu apare în paginile publice cât timp contul e suspendat.",
    // Masquée faute de confirmation : la décision du publiant, qu'il lève
    // lui-même. Rien à voir avec la modération, donc pas de « scrie la… ».
    unconfirmedBadge: "Inactiv",
    unconfirmedHint:
      "Nu mai apare în paginile publice, pentru că nu am primit răspuns la emailurile de confirmare. Dacă animalul e încă disponibil, reactivează anunțul.",
    reactivate: "Reactivează anunțul",
    // Cycle de confirmation en cours (lib/confirmations.ts) : la même
    // réponse que le bouton de l'email, pour qui passe par son compte — et
    // la seule pour une adresse non confirmée (email sans boutons).
    pendingHint: (plural: boolean, date: string) =>
      `Ți-am scris pe email să confirmi că ${
        plural ? "animalele sunt încă disponibile" : "animalul e încă disponibil"
      }. Fără răspuns, anunțul nu mai apare pe site din ${date}.`,
    stillAvailable: "E încă disponibil",
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
    // Pas d'introduction : la conséquence du consentement se dit une seule
    // fois, sous la case (contactConsentDescription).
    // Les deux groupes du formulaire : le contact d'abord, le reste ensuite.
    contactSection: "Date de contact",
    otherSection: "Despre tine",
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

    /* ——— Consentement à l'affichage public des coordonnées. ——— */
    // Le libellé dit seulement ce qu'on accepte — mais en entier : ce qui
    // sera montré et où. « Sunt de acord » sans objet ne serait pas un
    // consentement « spécifique » (RGPD art. 4(11)).
    contactConsentLabel:
      "Sunt de acord ca telefonul și emailul public de mai sus să fie afișate public pe anunțurile mele.",
    // La conséquence, une seule fois sur la page, et courte.
    contactConsentDescription:
      "Fără această bifă, anunțurile tale nu pot fi contactate. Poți retrage acordul oricând.",
    contactConsentPrivacyLink: "Cum tratăm datele tale",

    /* ——— Parola : changement depuis le profil. ——— */
    passwordTitle: "Parola",
    // La raison d'être de l'écran, en une phrase : un compte dont on doute.
    // « Celelalte sesiuni » — on dit ce que le geste fait d'autre.
    passwordIntro:
      "Schimbă parola dacă bănuiești că o știe altcineva. Celelalte sesiuni deschise cu contul tău se închid.",
    currentPassword: "Parola actuală",
    newPassword: "Parola nouă (cel puțin 8 caractere)",
    confirmPassword: "Repetă parola nouă",
    passwordMismatch: "Parolele nu coincid.",
    passwordUnchanged: "Parola nouă e identică cu cea actuală.",
    passwordChanged: "Parola a fost schimbată.",
    changePassword: "Schimbă parola",
    changePasswordPending: "Se schimbă…",
    // Compte Google sans mot de passe local : rien à changer ici.
    passwordGoogleOnly:
      "Intri în cont cu Google, fără parolă TakeMeHome. Parola se schimbă din contul tău Google.",

    /* ——— Drepturile tale : export et suppression. ——— */
    rightsTitle: "Datele mele",
    // Factuel : ce sont des droits du RGPD, la page le dit et s'arrête là.
    // Pas d'antithèse « nu X, ci Y » — c'est un tic d'écriture, et sur un
    // écran qui touche au droit il sonne comme une plaidoirie.
    rightsIntro:
      "Drepturi prevăzute de GDPR. Exercitarea lor nu trebuie motivată.",
    exportTitle: "Descarcă-ți datele",
    exportDescription:
      "Un fișier JSON cu tot ce avem despre tine: contul, profilul, animalele tale și adresele fotografiilor.",
    exportAction: "Descarcă (JSON)",
    exportPending: "Se pregătește…",
    exportFailed: "Descărcarea nu a reușit. Încearcă din nou.",
    deleteTitle: "Șterge contul",
    deleteDescription:
      "Îți șterge contul, toate animalele tale și fotografiile lor. Anunțurile dispar imediat de pe site. Nu se mai poate recupera nimic.",
    deleteAction: "Șterge contul",
    deletePending: "Se șterge…",
    deleteFailed: "Ștergerea nu a reușit. Încearcă din nou.",
    // Double confirmation : la boîte du navigateur d'abord, puis la frappe
    // du mot. Un compte effacé emporte les animaux et leurs photos — c'est
    // le seul geste du site que rien ne rattrape.
    deleteConfirmWord: "STERGE",
    deleteConfirmPrompt:
      "Ștergi definitiv contul, animalele tale și fotografiile lor? Nu se mai poate recupera.",
    deleteConfirmLabel: "Scrie STERGE ca să confirmi",
    deleteConfirmMismatch: "Scrie STERGE cu majuscule ca să confirmi.",
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
    // « Numele animalului », pas « Nume » : cinq personnes avaient écrit
    // LEUR nom dans le champ — le libellé seul ne disait pas de qui.
    name: "Numele animalului *",
    // La case sous le nom : cochée, le champ se désactive et l'annonce
    // affiche « Cățel » / « Pisică ». Avant elle, les sauveteurs écrivaient
    // « - » ou « Nu are » dans un champ qui les y forçait.
    noName: "Nu are nume",
    type: "Tip *",
    typePlaceholder: "Alege",
    /* ——— Fratries. Deux champs distincts, exprès : le nombre, et
       l'inséparabilité — une portée n'est pas un groupe inséparable. ——— */
    count: "Câți sunt?",
    mustStayTogether: "Se adoptă împreună",
    mustStayTogetherHint:
      "Bifează doar dacă nu pot fi despărțiți. Puii din aceeași fătare se adaptează de obicei bine și separat.",
    countInvalid: "Scrie un număr între 1 și 99.",
    sexMixedSingle: "„Mixt” e doar pentru mai multe animale.",
    /* ——— Échéance. Ce que la date fait, en une phrase : le semn dans les
       derniers jours, et l'annonce qui reste après. ——— */
    availableUntil: "Disponibil până la",
    availableUntilHint:
      "Doar dacă are un termen. În ultimele 14 zile, anunțul primește semnul „Până la …”; după dată rămâne publicat, doar semnul dispare.",
    availableUntilInvalid: "Data nu e validă.",
    sex: "Sex",
    age: "Vârstă",
    ageText: "Vârsta exactă",
    ageTextPlaceholder: "de ex. 2 ani",
    county: "Județ *",
    countyPlaceholder: "Alege județul",
    city: "Localitate",
    description: "Descriere",
    // Sans astérisque : les photos sont facultatives, à la création comme à
    // l'édition. Une fiche sans photo se publie et s'affiche (aplat crème).
    photo: "Fotografii",
    // Les deux entrées : l'appareil photo (écrans tactiles seulement —
    // sur un ordinateur, capture est ignoré et « Fă o poză » mentirait)
    // et la galerie / le disque.
    takePhoto: "Fă o poză",
    // Plusieurs fichiers d'un coup depuis la galerie ou le disque.
    choosePhoto: "Alege fotografii",
    chooseFromGallery: "Alege din galerie",
    // La consigne, tant qu'aucune photo n'est là — une information, jamais
    // une exigence. Elle dit ce que la première devient.
    photoHint:
      "Până la 4 fotografii, cu animalul în prim-plan. Prima apare pe card și când distribui anunțul. Se pregătesc în timp ce completezi restul.",
    /* ——— Les photos déjà là ou choisies : une vignette chacune. ——— */
    coverBadge: "Principală",
    photoAlt: (i: number) => `Fotografia ${i}`,
    replacePhoto: "Înlocuiește",
    replacePhotoLabel: (i: number) => `Înlocuiește fotografia ${i}`,
    // « Scoate » et non « Șterge » : rien n'est supprimé avant la sauvegarde.
    removePhoto: "Scoate",
    removePhotoLabel: (i: number) => `Scoate fotografia ${i}`,
    photosFull: "Ai pus 4 fotografii, cât se poate. Ca să adaugi alta, scoate una.",
    photosTruncated: (kept: number) =>
      kept === 1
        ? "Mai era loc pentru o singură fotografie: am păstrat-o pe prima aleasă."
        : `Mai era loc pentru ${kept} fotografii: le-am păstrat pe primele ${kept} alese.`,
    photosPending: (n: number) =>
      n === 1
        ? "O fotografie nouă e gata. Se trimite când salvezi."
        : `${n} fotografii noi sunt gata. Se trimit când salvezi.`,
    photosRemoved: (n: number) =>
      n === 1
        ? "Fotografia scoasă se șterge când salvezi."
        : `Cele ${n} fotografii scoase se șterg când salvezi.`,
    preparingCount: (i: number, n: number) =>
      `Se pregătește fotografia ${i} din ${n}…`,
    health: "Sănătate",
    sterilized: "Sterilizat",
    vaccinated: "Vaccinat",
    dewormed: "Deparazitat",
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
    photosTooMany: "Cel mult 4 fotografii pentru un anunț.",
    // Photo : sélection, préparation, envoi.
    notAnImage: "Fișierul nu e o imagine. Alege o fotografie.",
    fileTooLarge: (size: string) =>
      `Fișierul e prea mare (${size}, cel mult 25 MB). Alege altă fotografie.`,
    preparingFailed: "Fotografia nu s-a putut pregăti.",
    preparing: "Se pregătește fotografia…",
    uploading: (i: number, n: number, percent: number) =>
      n === 1
        ? `Se trimite fotografia… ${percent}%`
        : `Se trimite fotografia ${i} din ${n}… ${percent}%`,
    uploadingLabel: (n: number) =>
      n === 1 ? "Se trimite fotografia…" : "Se trimit fotografiile…",
    uploadNetworkError: "Fotografia nu s-a trimis: problemă de rețea. Încearcă din nou.",
    // Jamais le message brut de l'erreur : il arrive en anglais, du client
    // blob ou du réseau, et ne dit rien d'actionnable à un sauveteur. Le
    // détail part dans Sentry, l'utilisateur reçoit une phrase utile. Les
    // refus prononcés par /api/photo/upload (limite, session, suspension)
    // arrivent, eux, avec leur propre phrase (STR.upload.*).
    uploadFailed: "Fotografia nu s-a trimis. Încearcă din nou.",
    saving: "Se salvează…",
    // Limite de débit : dire que c'est une limite, pas une panne, et que
    // rien n'est perdu — c'est une association qui publie huit animaux
    // d'affilée qui lit ceci, pas un robot.
    tooManyRequests:
      "Prea multe salvări într-un minut. Așteaptă un minut și încearcă din nou: ce ai completat rămâne pe ecran.",
    // Compte suspendu pendant que le formulaire était ouvert (sinon la page
    // a déjà renvoyé vers /cont) : dire que rien n'a été enregistré, et à
    // qui écrire — sans l'adresse, la personne croit à une panne.
    accountSuspended: `Contul tău e suspendat: anunțul nu s-a salvat. Nu mai poți publica sau modifica anunțuri. Dacă crezi că e o eroare, scrie la ${CONTACT_EMAIL}.`,
    // Session expirée pendant la saisie : un renvoi vers /login jetterait
    // tout ce qui est tapé. Le formulaire reste, la personne se reconnecte
    // à côté et renvoie.
    sessionExpired:
      "Sesiunea a expirat și anunțul nu s-a salvat. Intră în cont într-o filă nouă, apoi apasă din nou pe buton: ce ai completat rămâne pe ecran.",
    // Panne côté serveur pendant l'enregistrement : la saisie reste à
    // l'écran, l'utilisateur n'a rien à retaper.
    saveFailed: "Anunțul nu s-a putut salva. Încearcă din nou.",
  },

  /* ——— Emails transactionnels (texte brut, voir lib/email.ts ; la
         confirmation des annonces a aussi une version HTML, pour les
         photos et les boutons). ——— */
  email: {
    verify: {
      subject: "Confirmă-ți adresa de email – TakeMeHome",
      body: (name: string, url: string) =>
        `Salut, ${name},\n\n` +
        "Confirmă adresa de email a contului tău TakeMeHome deschizând linkul de mai jos:\n\n" +
        `${url}\n\n` +
        "Linkul e valabil 24 de ore. Dacă nu ți-ai creat cont pe TakeMeHome, ignoră acest email.\n\n" +
        "TakeMeHome",
    },
    // Resetarea parolei : o oră (auth.ts, resetPasswordTokenExpiresIn) —
    // cine a cerut linkul îl așteaptă acum, în fața formularului. Ultima
    // frază spune ce se întâmplă dacă NU ai cerut tu: nimic.
    resetPassword: {
      subject: "Resetează-ți parola – TakeMeHome",
      body: (name: string, url: string) =>
        `Salut, ${name},\n\n` +
        "Ai cerut resetarea parolei contului tău TakeMeHome. Alege o parolă nouă deschizând linkul de mai jos:\n\n" +
        `${url}\n\n` +
        "Linkul e valabil o oră și se poate folosi o singură dată. Dacă nu ai cerut tu resetarea, ignoră acest email: parola rămâne neschimbată.\n\n" +
        "TakeMeHome",
    },
    // Cont fără parolă locală (Google) : singurul loc unde se poate spune
    // fără să dezvăluie nimic — emailul ajunge doar la proprietarul adresei.
    // Fără link: nu e nimic de resetat.
    resetPasswordGoogle: {
      subject: "Contul tău TakeMeHome intră cu Google – TakeMeHome",
      body: (name: string, loginUrl: string) =>
        `Salut, ${name},\n\n` +
        "Cineva a cerut resetarea parolei pentru această adresă. Contul tău TakeMeHome nu are parolă: intri în cont cu butonul „Continuă cu Google”, de aici:\n\n" +
        `${loginUrl}\n\n` +
        "Dacă nu ai cerut tu resetarea, ignoră acest email.\n\n" +
        "TakeMeHome",
    },
  },

  /* ——— Confirmation des annonces : l'email (lib/confirmation-email.ts)
         et la page /confirmare/[token] où mènent ses boutons. Message de
         SERVICE uniquement : aucun lien vers les réseaux, aucune nouvelle
         du site, aucun appel à publier — c'est ce qui le dispense de
         consentement (directive 2002/58, art. 13 ; loi 506/2004, art. 12).
         La question « L-a adoptat cineva… » vit sur la page, jamais dans
         l'email. Accords : on parle de « animalul / animalele » (neutre),
         jamais du nom, pour ne pas accorder « disponibil » au sexe. ——— */
  confirmari: {
    email: {
      subject: (count: number, reminder: boolean) =>
        `${reminder ? "Reamintire: " : ""}${
          count === 1
            ? "Anunțul tău e încă valabil?"
            : "Anunțurile tale sunt încă valabile?"
        } – TakeMeHome`,
      greeting: (name: string) => `Salut, ${name},`,
      intro: (count: number) =>
        "Ținem anunțurile de pe TakeMeHome la zi, ca oamenii să nu sune pentru animale care și-au găsit deja familia. " +
        (count === 1
          ? "Ne spui cum stau lucrurile cu animalul de mai jos?"
          : "Ne spui cum stau lucrurile cu animalele de mai jos?"),
      // Les deux libellés voulus par l'opérateur, tels quels, à poids égal :
      // aucun des deux n'est le « bon » clic.
      available: "Încă disponibil",
      adopted: "A fost adoptat",
      noteUpdated: (relative: string) => `Ultima actualizare: ${relative}.`,
      noteRequested: (plural: boolean) =>
        plural
          ? "Un vizitator ne-a spus că au fost deja adoptate."
          : "Un vizitator ne-a spus că a fost deja adoptat.",
      noteReminder: (date: string) =>
        `A doua întrebare: fără răspuns, anunțul nu mai apare pe site din ${date}.`,
      links:
        "Linkurile funcționează fără să intri în cont și sunt valabile 30 de zile.",
      // Adresse jamais confirmée : elle est peut-être mal tapée, et l'email
      // chez un inconnu. Pas de boutons, donc : le compte (mot de passe ou
      // Google) est la seule porte.
      loginToConfirm: "Intră în cont ca să confirmi",
      unverified:
        "Adresa ta de email nu e confirmată încă, așa că răspunsul se dă din contul tău.",
      process:
        "Dacă nu primim niciun răspuns, îți mai scriem o dată după două săptămâni. După alte două săptămâni fără răspuns, anunțul nu mai apare pe site. Rămâne în contul tău și îl poți reactiva oricând.",
      why: "Primești acest email pentru că ai anunțuri publicate pe TakeMeHome. Le poți actualiza și din contul tău:",
      signature: "TakeMeHome",
    },
    page: {
      metaTitle: "Confirmă anunțul – TakeMeHome",
      availableQuestion: (plural: boolean) =>
        plural
          ? "Confirmi că animalele sunt încă disponibile?"
          : "Confirmi că animalul e încă disponibil?",
      adoptedQuestion: (plural: boolean) =>
        plural
          ? "Confirmi că animalele au fost adoptate?"
          : "Confirmi că animalul a fost adoptat?",
      confirmAvailable: (plural: boolean) =>
        plural ? "Da, sunt încă disponibile" : "Da, e încă disponibil",
      confirmAdopted: (plural: boolean) =>
        plural ? "Da, au fost adoptate" : "Da, a fost adoptat",
      // L'autre lien, pour qui s'est trompé de bouton dans l'email.
      switchToAdopted: (plural: boolean) =>
        plural ? "De fapt, au fost adoptate" : "De fapt, a fost adoptat",
      switchToAvailable: (plural: boolean) =>
        plural ? "De fapt, sunt încă disponibile" : "De fapt, e încă disponibil",
      // Une portée dont une partie seulement est partie : ce n'est pas une
      // adoption de toute l'annonce.
      groupHint:
        "Dacă au plecat doar unele dintre ele, nu confirma aici: modifică numărul din contul tău.",
      currentAdopted: "Acum e marcat ca adoptat.",
      currentUnconfirmed:
        "Acum nu mai apare pe site. Confirmarea îl readuce în pagini.",
      pending: "Se salvează…",
      availableDoneTitle: "Mulțumim!",
      availableDone:
        "Anunțul rămâne pe site. Îți scriem din nou dacă nu e actualizat timp de 3 săptămâni.",
      // Sans contact affiché : « rămâne pe site » serait faux. La réponse
      // est enregistrée, le bloc au-dessus de la carte dit le reste.
      availableDoneNoContact:
        "Am salvat răspunsul tău. Îți scriem din nou dacă anunțul nu e actualizat timp de 3 săptămâni.",
      // Masqué par la modération : le statut change, la visibilité non.
      stillHidden: "Anunțul rămâne ascuns de echipa TakeMeHome.",
      adoptedDoneTitle: "Mulțumim! Anunțul e marcat ca adoptat.",
      // La question de l'opérateur, mot pour mot ; facultative.
      sourceQuestion: (plural: boolean) =>
        plural
          ? "Le-a adoptat cineva care le-a găsit pe takemehome.ro?"
          : "L-a adoptat cineva care l-a găsit pe takemehome.ro?",
      sourceHint:
        "Răspunsul e opțional. Ne ajută să aflăm câte adopții pornesc de pe site.",
      sourceYes: "Da",
      sourceNo: "Nu",
      sourceUnknown: "Nu știu",
      sourceDone: "Mulțumim pentru răspuns!",
      seeListing: "Vezi anunțul",
      invalidTitle: "Linkul nu mai e valabil",
      invalid:
        "Linkurile din emailurile noastre sunt valabile 30 de zile. Poți actualiza anunțul din contul tău.",
      toAccount: "Mergi la contul tău",
      missingTitle: "Anunțul nu mai există",
      missing: "A fost șters între timp. Nu mai e nimic de confirmat.",
      suspendedTitle: "Contul e suspendat",
      suspended: "Anunțurile acestui cont nu mai pot fi modificate.",
      tooManyRequests:
        "Prea multe încercări într-un minut. Așteaptă puțin și încearcă din nou.",
      failed: "Nu s-a putut salva. Încearcă din nou.",
    },
  },

  /* ——— Erreurs de compression photo (côté navigateur). ——— */
  compress: {
    unsupportedFormat:
      "Formatul imaginii nu e acceptat. Alege un JPEG, PNG sau WebP.",
    unreadable: "Imaginea nu poate fi citită.",
    cannotPrepare: "Fotografia nu s-a putut pregăti pe acest dispozitiv.",
    compressionFailed: "Fotografia nu s-a putut comprima pe acest dispozitiv.",
  },

  /* ——— API d'upload (messages renvoyés au navigateur). Le formulaire les
         affiche tels quels sous le champ photo (lib/upload-token.ts lit le
         corps de la réponse) : chacun dit ce qui s'est passé ET que la
         saisie n'est pas perdue. ——— */
  upload: {
    signInRequired:
      "Sesiunea a expirat și fotografia nu s-a trimis. Intră în cont într-o filă nouă, apoi apasă din nou pe buton: ce ai completat rămâne pe ecran.",
    accountSuspended: `Contul tău e suspendat: fotografia nu s-a trimis și anunțul nu se poate salva. Dacă crezi că e o eroare, scrie la ${CONTACT_EMAIL}.`,
    pathNotAllowed: "Cale de fotografie neautorizată.",
    animalNotFound: "Animalul nu a fost găsit.",
    invalidStatus: "Status invalid.",
    tooManyRequests:
      "Prea multe fotografii trimise într-un minut. Așteaptă un minut și apasă din nou pe buton: ce ai completat rămâne pe ecran.",
    // Réponse par défaut de la route : tout ce qui n'est pas un de nos
    // propres refus sort sous cette phrase, jamais le message d'origine
    // (il viendrait de @vercel/blob, en anglais et technique).
    failed: "Fotografia nu s-a putut trimite. Încearcă din nou.",
  },

  /* ——— 404, hors ligne, chargement. ——— */
  notFound: {
    title: "Pagina nu a fost găsită",
    description: "Linkul e greșit sau pagina nu mai există.",
    cta: "Vezi animalele de adoptat",
  },
  // Écran d'erreur (error.tsx et global-error.tsx). Jamais de détail
  // technique ici : le message d'origine, la pile et la requête restent
  // côté serveur. Seul le digest s'affiche, c'est une empreinte opaque qui
  // permet de retrouver la ligne de log correspondante.
  error: {
    title: "Ceva n-a mers bine",
    // « nu a ta » retiré : c'est l'antithèse « nu X, ci Y », et la moitié
    // utile de la phrase tient sans elle. Ce qui compte pour la personne,
    // c'est de savoir qu'elle n'a rien à corriger de son côté — « de partea
    // noastră » le dit déjà.
    description: "Pagina nu s-a putut afișa. E o problemă de partea noastră.",
    retry: "Încearcă din nou",
    toAnimals: "Vezi animalele de adoptat",
    code: (digest: string) => `Cod: ${digest}`,
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
    // « Dacă crezi că e o eroare, scrie la <adresă>. » — la même phrase
    // sous chaque décision de modération (compte suspendu, annonce
    // masquée), coupée autour du lien ContactEmailLink.
    errorContactBefore: "Dacă crezi că e o eroare, scrie la ",
    errorContactAfter: ".",
  },

  /* ——— Métadonnées globales (layout racine, manifest PWA). ——— */
  meta: {
    rootTitle: "TakeMeHome – animale din România care își caută o familie",
    rootDescription:
      "Anunțuri de adopție pentru animale salvate din România. Filtrezi după județ, vârstă sau talie și suni direct persoana care are animalul în grijă.",
  },
} as const;
