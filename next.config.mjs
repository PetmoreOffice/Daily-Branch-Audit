/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    formats: ["image/webp", "image/avif"],
    minimumCacheTTL: 86400,
  },
  compress: true,
  experimental: {
    optimizeCss: true,
  },
};

export default nextConfig;
