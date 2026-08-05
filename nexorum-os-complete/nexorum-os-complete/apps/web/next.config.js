/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  distDir: 'dist',
  images: { unoptimized: true },
  transpilePackages: ['@nexorum/core', '@nexorum/db'],
};

module.exports = nextConfig;
