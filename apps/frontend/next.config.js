/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Нужен для многоэтапного Dockerfile — копируется только .next/standalone + .next/static + public.
  output: "standalone",
  transpilePackages: ["@autism-connect/ui", "@autism-connect/shared"],
  images: {
    remotePatterns: [
      { protocol: "http", hostname: "localhost" },
      { protocol: "http", hostname: "minio" },
    ],
  },
};

module.exports = nextConfig;
