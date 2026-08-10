import { headers } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { auth } from "@/lib/auth";
import { SignOutButton } from "./sign-out-button";

// La vraie vérification de session se fait ici, dans chaque page protégée :
// le proxy ne fait qu'un contrôle optimiste sur la présence du cookie.
export default async function ContPage() {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session) {
    redirect("/login");
  }

  return (
    <main>
      <h1>Mon compte</h1>
      <p>Nom : {session.user.name}</p>
      <p>Email : {session.user.email}</p>
      <p>
        <Link href="/cont/profil">Modifier mon profil</Link>
      </p>
      <SignOutButton />
    </main>
  );
}
