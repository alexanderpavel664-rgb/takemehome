import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProfileForm } from "./profile-form";

export default async function ProfilPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const { user } = session;
  return (
    // w-full : enfant du body en flex-col, mx-auto seul annulerait
    // l'étirement — la page se tasserait sur la largeur de ses champs.
    <main className="mx-auto w-full max-w-lg px-4 py-4">
      <h1 className="text-2xl font-semibold text-warm-ink">Mon profil</h1>
      <p className="mt-2 text-base text-warm-gray">
        Ces informations s’affichent comme contact sur vos annonces.
      </p>
      {/* Le formulaire est posé sur l'ivoire : un contenant, pas des champs
          qui flottent sur le papier. */}
      <Card className="mt-4 p-4">
        <ProfileForm
          initial={{
            name: user.name,
            phone: user.phone ?? "",
            publicEmail: user.publicEmail ?? "",
            county: user.county ?? "",
            city: user.city ?? "",
            description: user.description ?? "",
          }}
        />
      </Card>
      <div className="mt-4">
        <ButtonLink variant="ghost" href="/cont">
          Retour au compte
        </ButtonLink>
      </div>
    </main>
  );
}
