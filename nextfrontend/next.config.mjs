/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        // Proxy all /api/* requests to the FastAPI backend.
        // NextJS API routes (e.g. /api/auth/*) take precedence automatically.
        source: '/api/:path*',
        destination: `${process.env.BACKEND_URL || 'http://127.0.0.1:8000'}/:path*`,
      },
    ];
  },
  images: {
    domains: ['127.0.0.1', 'localhost'],
  },
};

export default nextConfig;
