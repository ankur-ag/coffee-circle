import type { NextConfig } from "next";
import { setupDevPlatform } from "@cloudflare/next-on-pages/next-dev";

if (process.env.NODE_ENV === "development") {
  (async () => {
    await setupDevPlatform();
  })();
}

const nextConfig: NextConfig = {
  // Redirect root to /book
  productionBrowserSourceMaps: false,
  compress: true,
};

export default nextConfig;
