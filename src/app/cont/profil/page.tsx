import { redirect } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { STR } from "@/lib/strings";
import { getSession } from "@/lib/viewer";
import { ButtonLink } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { ProfileForm } from "./profile-form";
import { PasswordSection } from "./password-form";
import { AccountData } from "./account-data";

export const metadata: Metadata = {
  title: STR.profil.metaTitle,
};

export default async function ProfilPage() {
  const session = await getSession();
  if (!session) {
    redirect("/login");
  }
  const { user } = session;

  // Un mot de passe local existe-t-il ? better-auth range les identifiants
  // email + mot de passe dans Account sous providerId "credential" ; un
  // compte entré par Google seul n'en a pas, et la section Parola le dit
  // plutôt que de proposer un formulaire qui échouerait.
  const credential = await prisma.account.findFirst({
    where: { userId: user.id, providerId: "credential" },
    select: { password: true },
  });
  const hasPassword = Boolean(credential?.password);

  return (
    // w-full : enfant du body en flex-col, mx-auto seul annulerait
    // l'étirement — la page se tasserait sur la largeur de ses champs.
    <main className="mx-auto w-full max-w-lg px-4 py-4">
      <h1 className="text-2xl font-semibold text-warm-ink">
        {STR.profil.title}
      </h1>
      {/* Pas d'introduction : la conséquence du consentement se lit une seule
          fois, sous la case, dans le formulaire. Le formulaire est posé sur
          l'ivoire : un contenant, pas des champs qui flottent sur le papier. */}
      <Card className="mt-4 p-4">
        <ProfileForm
          initial={{
            name: user.name,
            phone: user.phone ?? "",
            publicEmail: user.publicEmail ?? "",
            county: user.county ?? "",
            city: user.city ?? "",
            description: user.description ?? "",
            // Le champ n'existe pas encore sur les sessions ouvertes avant
            // la migration : `?? false` garde la case décochée plutôt que
            // de la laisser dans un état indéfini.
            contactConsent: user.contactConsent ?? false,
          }}
        />
      </Card>

      <PasswordSection hasPassword={hasPassword} />

      <AccountData />

      <div className="mt-8">
        <ButtonLink variant="ghost" href="/cont">
          {STR.profil.backToAccount}
        </ButtonLink>
      </div>
    </main>
  );
}
