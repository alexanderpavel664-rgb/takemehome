import { config } from "dotenv";
import { defineConfig, env } from "prisma/config";

// Prisma ne charge plus les fichiers .env automatiquement en v7.
// Les deux URLs Neon vivent dans .env.local (jamais commité).
config({ path: ".env.local" });

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
  },
  datasource: {
    // Connexion directe (sans -pooler) : obligatoire pour les migrations
    // sur Neon, sinon "cannot start a transaction in prepared statements mode".
    // Le runtime applicatif utilise DATABASE_URL (pooler) via l'adaptateur Neon.
    url: env("DIRECT_URL"),
  },
});
