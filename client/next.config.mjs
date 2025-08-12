/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    REACT_APP_BACKEND_URL: process.env.REACT_APP_BACKEND_URL,
    REACT_APP_API_BASE_URL: process.env.REACT_APP_API_BASE_URL,
  },
  output: 'standalone',
  experimental: {
    outputFileTracingRoot: undefined,
  },
  typescript: {
    // Skip TypeScript checking during build for deployment
    ignoreBuildErrors: true,
  },
  eslint: {
    // Skip ESLint during build for deployment
    ignoreDuringBuilds: true,
  },
};

export default nextConfig;
