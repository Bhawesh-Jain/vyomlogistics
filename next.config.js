/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'http',
        hostname: 'localhost',
      }
    ],
  },
  experimental: {
    serverActions: {
      bodySizeLimit: '125mb'
    },
  },
}

module.exports = nextConfig
