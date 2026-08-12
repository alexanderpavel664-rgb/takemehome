import { LoginForm } from "./login-form";
import { SiteHeader } from "@/components/site-header";

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
    </>
  );
}
