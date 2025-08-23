/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: process.env.BACKEND_URL || 'http://127.0.0.1:8000/:path*', // Proxy to Backend
      },
    ]
  },
  images: {
    domains: ['127.0.0.1', 'localhost'],
  },
};

export default nextConfig;
