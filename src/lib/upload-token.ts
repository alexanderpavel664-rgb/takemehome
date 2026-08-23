import type { HandleUploadBody } from "@vercel/blob/client";

/**
 * Demande d'un jeton d'upload client à /api/photo/upload — la première des
 * deux requêtes d'un envoi de photo (la seconde est le PUT direct du
 * navigateur vers le store, avec ce jeton).
 *
 * POURQUOI PAS upload() DE @vercel/blob/client — il fait exactement ceci,
 * mais ignore le corps des réponses non-2xx : limite de débit (429),
 * session expirée ou compte suspendu (400), panne (500) arrivent tous comme
 * « Failed to retrieve the client token ». Le formulaire ne pouvait alors
 * que dire « attends une minute » — faux pour qui est déconnecté (il
 * attendrait toujours) et faux pour qui est suspendu. Ici on lit la phrase
 * roumaine que la route a écrite (STR.upload.*) et on la fait remonter.
 *
 * Le protocole est celui de handleUpload (type HandleUploadBody, exporté
 * par le SDK) ; put() prend ensuite le jeton tel quel, et le callback
 * onUploadCompleted reste porté par le jeton — rien ne change côté serveur.
 */
export class UploadRefusedError extends Error {
  constructor(
    /** La phrase écrite par la route, ou null si le corps n'était pas le nôtre. */
    readonly serverMessage: string | null,
    readonly status: number,
  ) {
    super(serverMessage ?? `upload token refused (${status})`);
    this.name = "UploadRefusedError";
  }
}

export async function requestUploadToken({
  pathname,
  clientPayload,
}: {
  pathname: string;
  clientPayload: string | null;
}): Promise<string> {
  const body: HandleUploadBody = {
    type: "blob.generate-client-token",
    payload: { pathname, clientPayload, multipart: false },
  };
  const response = await fetch("/api/photo/upload", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    // Le corps n'est le nôtre que s'il est du JSON avec `error` : une page
    // HTML de la plateforme (502, protection de déploiement) ne l'est pas,
    // et on ne montre jamais autre chose que nos propres phrases.
    let serverMessage: string | null = null;
    try {
      const data: unknown = await response.json();
      if (
        data !== null &&
        typeof data === "object" &&
        "error" in data &&
        typeof data.error === "string"
      ) {
        serverMessage = data.error;
      }
    } catch {
      // Corps illisible : on garde null.
    }
    throw new UploadRefusedError(serverMessage, response.status);
  }

  const { clientToken } = (await response.json()) as { clientToken?: unknown };
  if (typeof clientToken !== "string") {
    throw new Error("upload token missing from response");
  }
  return clientToken;
}
