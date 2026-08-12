import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { ButtonLink } from "@/components/ui/button";
import { ProfileForm } from "./profile-form";

export default async function ProfilPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const { user } = session;
  return (
    <main className="mx-auto max-w-lg p-4">
      <h1 className="text-2xl font-semibold text-warm-ink">Mon profil</h1>
      <p className="mt-2 text-base text-warm-gray">
        Ces informations serviront de contact sur les fiches des animaux du
        refuge.
      </p>
      <div className="mt-6">
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
      </div>
      <div className="mt-6">
        <ButtonLink variant="ghost" href="/cont">
          Retour au compte
        </ButtonLink>
      </div>
    </main>
  );
}
