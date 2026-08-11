import type { NextConfig } from "next";
import { BLOB_HOST } from "./src/lib/animal-photo";

const nextConfig: NextConfig = {
  images: {
    // Autorise next/image à optimiser les photos du store Vercel Blob —
    // hostname exact du store uniquement, jamais de wildcard de sous-domaine.
    remotePatterns: [new URL(`https://${BLOB_HOST}/**`)],
  },
};

export default nextConfig;
