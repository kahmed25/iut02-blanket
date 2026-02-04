/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'hz0qnbuf64.execute-api.ap-southeast-1.amazonaws.com', 'dev.d1js9a712g4lw.amplifyapp.com'],
    unoptimized: true
  },
  trailingSlash: true,
}

module.exports = nextConfig

