import type { NextConfig } from "next";

const config: NextConfig = {
  // A static site: no server code, so the strict security headers in vercel.json keep working.
  output: "export",
  reactStrictMode: true,
  poweredByHeader: false,
  images: { unoptimized: true },
  // Keep the same Vercel setting names the app already uses (built into the page at build time).
  env: {
    EXPO_PUBLIC_RELAY_URL: process.env.EXPO_PUBLIC_RELAY_URL ?? process.env.NEXT_PUBLIC_RELAY_URL ?? "",
    EXPO_PUBLIC_RELAY_KEY: process.env.EXPO_PUBLIC_RELAY_KEY ?? process.env.NEXT_PUBLIC_RELAY_KEY ?? "",
  },
};

export default config;
