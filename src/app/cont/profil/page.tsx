import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { ProfileForm } from "./profile-form";

export default async function ProfilPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  const { user } = session;
  return (
    <main>
      <h1>Mon profil</h1>
      <p>
        Ces informations serviront de contact sur les fiches des animaux du
        refuge.
      </p>
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
      <p>
        <Link href="/cont">Retour au compte</Link>
      </p>
    </main>
  );
}
