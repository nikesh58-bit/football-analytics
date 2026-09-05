/** @type {import('next').NextConfig} */
function backendUrl() {
  const raw = (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001').trim().replace(/\/+$/, '');
  if (/^[a-zA-Z][a-zA-Z0-9+.-]*:\/\//.test(raw)) return raw;
  return `https://${raw}`; // Render `host` property is a bare hostname
}
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  images: { remotePatterns: [{ protocol: 'https', hostname: 'images.sportmonks.com' }, { protocol: 'https', hostname: 'media.api-sports.io' }, { protocol: 'https', hostname: 'cdn.sportmonks.com' }, { protocol: 'https', hostname: 'via.placeholder.com' }], formats: ['image/avif', 'image/webp'] },
  async rewrites() { return [{ source: '/api/backend/:path*', destination: `${backendUrl()}/api/:path*` }]; },
};
module.exports = nextConfig;