import type { NextConfig } from "next";


const nextConfig: NextConfig = {
  // Redirect root to /book
  productionBrowserSourceMaps: false,
  compress: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '/**',
      },
    ],
    // Optimize image loading
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
  },
  // Enable React optimizations
  reactStrictMode: true,
};

export default nextConfig;
