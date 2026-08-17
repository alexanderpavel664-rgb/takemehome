import type { Metadata } from "next";
import { LoginForm } from "./login-form";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { STR } from "@/lib/strings";

export const metadata: Metadata = {
  title: STR.auth.login.metaTitle,
};

// Server Component : lit le paramètre d'erreur renvoyé par le callback OAuth
// (errorCallbackURL), évite un useSearchParams côté client.
export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const { error } = await searchParams;
  return (
    <>
      <SiteHeader />
      <LoginForm oauthError={error} />
      <SiteFooter />
    </>
  );
}
