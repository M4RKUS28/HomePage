/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  // No rewrites needed - the catch-all API route (/api/[...path]/route.js)
  // reads the iron-session, signs a fresh JWT, and proxies to FastAPI.
  images: {
    domains: ['127.0.0.1', 'localhost'],
  },
};

export default nextConfig;
