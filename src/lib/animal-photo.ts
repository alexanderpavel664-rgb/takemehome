// Hostname public du store Vercel Blob "takemehome" (store_CkfwR1krtIT8vqBy).
// Ce n'est pas un secret : il apparaît dans chaque URL publique de photo.
// Vérifié empiriquement par un put() de test — ne pas le déduire du dashboard.
export const BLOB_HOST = "ckfwr1krtit8vqby.public.blob.vercel-storage.com";

// Chaque refuge n'écrit que sous animale/<userId>/ ; la route de jeton et les
// server actions refusent tout chemin hors de cet espace. Sans ce cloisonnement,
// un refuge pourrait enregistrer l'URL de la photo d'un autre refuge sur son
// propre animal, puis la faire supprimer du store lors d'un remplacement.
export function animalPhotoPathname(userId: string, extension: string): string {
  return `animale/${userId}/photo.${extension}`;
}

export function isOwnedAnimalPhotoUrl(url: string, userId: string): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }
  return (
    parsed.protocol === "https:" &&
    parsed.host === BLOB_HOST &&
    parsed.pathname.startsWith(`/animale/${userId}/`)
  );
}
