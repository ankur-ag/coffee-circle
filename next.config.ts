import type { NextConfig } from "next";
import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";

if (process.env.NODE_ENV === "development") {
  (async () => {
    await setupDevPlatform();
  })();
}

const nextConfig: NextConfig = {
  // Redirect root to /book
  // Add other config options here if needed
  // Add other config options here if needed
};

export default nextConfig;
