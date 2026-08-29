/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: { remotePatterns: [{ protocol: 'https', hostname: 'images.sportmonks.com' }, { protocol: 'https', hostname: 'media.api-sports.io' }, { protocol: 'https', hostname: 'cdn.sportmonks.com' }, { protocol: 'https', hostname: 'via.placeholder.com' }], formats: ['image/avif', 'image/webp'] },
  async rewrites() { return [{ source: '/api/backend/:path*', destination: `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001'}/api/:path*` }]; },
};
module.exports = nextConfig;