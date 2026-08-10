import { createAuthClient } from "better-auth/react";
import { inferAdditionalFields } from "better-auth/client/plugins";
import type { auth } from "@/lib/auth";

// inferAdditionalFields type les champs métier (phone, county...) côté client.
export const authClient = createAuthClient({
  plugins: [inferAdditionalFields<typeof auth>()],
});
