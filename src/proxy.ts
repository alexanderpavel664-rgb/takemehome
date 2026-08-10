import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

// Contrôle optimiste recommandé par Better Auth : on ne vérifie que la
// présence du cookie de session (pas d'appel DB dans le proxy). La
// vérification réelle (auth.api.getSession) est faite dans chaque page
// protégée — un cookie forgé ne passe pas au-delà de la redirection.
export function proxy(request: NextRequest) {
  const sessionCookie = getSessionCookie(request);
  if (!sessionCookie) {
    return NextResponse.redirect(new URL("/login", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/cont/:path*"],
};
