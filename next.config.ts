import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  // Redirect root to /book
  productionBrowserSourceMaps: false,
  compress: true,
};

export default nextConfig;
