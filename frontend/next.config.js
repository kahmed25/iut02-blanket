/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: ['localhost', 'hz0qnbuf64.execute-api.ap-southeast-1.amazonaws.com'],
    unoptimized: true
  },
  // Enable static export for Amplify deployment
  // This only affects production builds (npm run build)
  // Local dev (npm run dev) works normally
  output: process.env.BUILD_ENV === 'production' ? 'export' : undefined,
  // Disable image optimization for static export
  ...(process.env.BUILD_ENV === 'production' && {
    images: {
      unoptimized: true
    }
  })
}

module.exports = nextConfig

