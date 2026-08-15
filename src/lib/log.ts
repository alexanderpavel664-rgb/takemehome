/**
 * Logs structurés : une ligne de sortie = un objet JSON sur une seule ligne.
 * En production les logs Vercel sont plein texte et non indexés — une phrase
 * française suivie d'un objet déversé par console.error est introuvable ;
 * `{"event":"animal.create_failed"}` se cherche.
 *
 * Trois interdits absolus, appliqués ici et non à l'appel (on ne peut pas
 * compter sur la discipline de chaque appelant) :
 * - les champs dont le NOM évoque un secret ou une donnée personnelle sont
 *   remplacés par [occulté] — mieux vaut perdre un champ innocent que
 *   laisser passer un jeton ;
 * - toute chaîne écrite (message d'erreur, pile, valeur de champ) passe par
 *   scrub() : valeurs des variables d'environnement, identifiants dans les
 *   URLs, téléphones roumains et emails y sont masqués. Les erreurs Prisma
 *   citent volontiers la chaîne de connexion complète, mot de passe compris ;
 * - le type LogFields n'accepte que des primitives : un objet passé par
 *   erreur ne compile pas, donc ne se déverse pas.
 *
 * Les scripts de scripts/ gardent volontairement console.log : ils écrivent
 * pour un humain devant un terminal, pas pour une recherche en production.
 */

/** Valeurs admises dans un log. Jamais d'objet : un objet se déverse. */
export type LogFields = Record<string, string | number | boolean | null | undefined>;

type Level = "info" | "warn" | "error";

// Le nom du champ suffit à le disqualifier.
const FORBIDDEN_KEY =
  /pass|parol|token|jeton|secret|credential|cookie|authorization|api[-_]?key|phone|telefon|dsn|email/i;

// Variables d'environnement dont la valeur ne doit jamais apparaître dans un
// texte. `_URL$` couvre DATABASE_URL et DIRECT_URL, qui portent le mot de
// passe Neon en clair. NEXT_PUBLIC_* est déjà public par construction.
const SECRET_ENV_NAME =
  /(SECRET|TOKEN|PASSWORD|CREDENTIAL|API[-_]?KEY|DSN|CLIENT_ID|_URL$)/i;

// Identifiants dans une URL : postgres://user:motdepasse@host → //[identifiants]@
const URL_CREDENTIALS = /\/\/[^/\s:@]+:[^/\s@]+@/g;
const EMAIL = /[\w.+-]+@[\w-]+\.[\w.-]+/g;
// Mobile roumain : 07xx xxx xxx, +407…, 00407…. Les bornes évitent de mordre
// au milieu d'un identifiant ou d'un horodatage.
const RO_PHONE = /(?<![\w+])(?:(?:\+|00)?40|0)7\d{2}[ .-]?\d{3}[ .-]?\d{3}(?!\d)/g;

let envSecretsCache: string[] | null = null;

function envSecrets(): string[] {
  if (envSecretsCache) {
    return envSecretsCache;
  }
  // Garde-fou : `process` n'existe pas dans un bundle navigateur. Ce module
  // est prévu pour le serveur, mais un import accidenté ne doit pas planter.
  if (typeof process === "undefined" || !process.env) {
    envSecretsCache = [];
    return envSecretsCache;
  }
  envSecretsCache = Object.entries(process.env)
    .filter(
      ([name, value]) =>
        typeof value === "string" &&
        value.length >= 8 &&
        !name.startsWith("NEXT_PUBLIC_") &&
        SECRET_ENV_NAME.test(name),
    )
    .map(([, value]) => value as string)
    // Le plus long d'abord : une URL de base contient parfois le mot de passe
    // en sous-chaîne, on masque l'englobant avant la partie.
    .sort((a, b) => b.length - a.length);
  return envSecretsCache;
}

/** Masque secrets et données personnelles dans un texte libre. */
export function scrub(text: string): string {
  let out = text;
  // split/join plutôt qu'une RegExp : aucune valeur d'env à échapper.
  for (const secret of envSecrets()) {
    out = out.split(secret).join("[env]");
  }
  return out
    .replace(URL_CREDENTIALS, "//[identifiants]@")
    .replace(EMAIL, "[email]")
    .replace(RO_PHONE, "[telefon]");
}

/** Nettoie un jeu de champs : noms interdits occultés, chaînes nettoyées. */
export function safeFields(fields?: LogFields): LogFields {
  if (!fields) {
    return {};
  }
  const out: LogFields = {};
  for (const [key, value] of Object.entries(fields)) {
    if (value === undefined) {
      continue;
    }
    if (FORBIDDEN_KEY.test(key)) {
      out[key] = "[occulté]";
      continue;
    }
    out[key] = typeof value === "string" ? scrub(value).slice(0, 500) : value;
  }
  return out;
}

/** Décrit une erreur en champs plats — nom, message, pile écrêtée, digest. */
export function describeError(error: unknown): LogFields {
  if (!(error instanceof Error)) {
    return { errorMessage: scrub(String(error)).slice(0, 500) };
  }
  return {
    errorName: error.name,
    errorMessage: scrub(error.message).slice(0, 500),
    // 12 lignes : de quoi situer l'appel sans noyer la ligne JSON.
    stack: error.stack
      ? scrub(error.stack).split("\n").slice(0, 12).join("\n")
      : undefined,
    // Le digest relie la page d'erreur vue par l'utilisateur à cette ligne.
    digest:
      "digest" in error && typeof error.digest === "string"
        ? error.digest
        : undefined,
  };
}

function emit(level: Level, event: string, fields: LogFields): void {
  const line = JSON.stringify({
    time: new Date().toISOString(),
    level,
    event,
    ...fields,
  });
  // console reste la sortie : c'est ce que Vercel collecte. Seul le format
  // change. Le niveau choisit le flux, que Vercel affiche comme tel.
  if (level === "error") {
    console.error(line);
  } else if (level === "warn") {
    console.warn(line);
  } else {
    console.log(line);
  }
}

/** `event` est un identifiant stable et cherchable : `photo.upload_failed`. */
export function logInfo(event: string, fields?: LogFields): void {
  emit("info", event, safeFields(fields));
}

export function logWarn(event: string, fields?: LogFields): void {
  emit("warn", event, safeFields(fields));
}

export function logError(event: string, error: unknown, fields?: LogFields): void {
  emit("error", event, { ...describeError(error), ...safeFields(fields) });
}
