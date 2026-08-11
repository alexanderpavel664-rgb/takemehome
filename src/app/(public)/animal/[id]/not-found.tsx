import Link from "next/link";

/** Id inexistant (ou animal supprimé) → 404 propre avec retour à la liste. */
export default function AnimalNotFound() {
  return (
    <main className="mx-auto max-w-3xl p-4 text-center">
      <h1 className="mt-10 text-2xl font-bold">Animal introuvable</h1>
      <p className="mt-2">
        Cet animal n&rsquo;existe pas ou n&rsquo;est plus publié.
      </p>
      <p className="mt-6">
        <Link href="/animale" className="inline-block min-h-11 underline">
          Voir les animaux à adopter
        </Link>
      </p>
    </main>
  );
}
