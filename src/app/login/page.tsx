import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { safeNextPath } from "@/lib/next-path";
import { STR } from "@/lib/strings";

export const metadata: Metadata = {
  title: STR.auth.login.metaTitle,
};

// Server Component : lit le paramètre d'erreur renvoyé par le callback OAuth
// (errorCallbackURL) et le chemin de retour `next` (posé par les pages qui
// exigent un compte, comme le signalement), évite un useSearchParams côté
// client. `next` est filtré ici, côté serveur, avant d'atteindre le
// formulaire : voir safeNextPath.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; next?: string }>;
}) {
  const { error, next } = await searchParams;
  return (
    <>
      <SiteHeader />
      <LoginForm oauthError={error} next={safeNextPath(next)} />
      <SiteFooter />
    </>
  );
}
