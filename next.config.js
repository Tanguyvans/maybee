/** @type {import('next').NextConfig} */
const nextConfig = {
    reactStrictMode: true,
    async rewrites() {
      return [
        {
          source: '/:path*',
          destination: '/:path*',
        },
      ];
    },
    // Ajoutez cette configuration pour gérer les paramètres d'URL
    experimental: {
      scrollRestoration: true,
    },
  }
  
  module.exports = nextConfig