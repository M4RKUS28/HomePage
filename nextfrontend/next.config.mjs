/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        // BACKEND_URL is set in Docker; fall back to localhost for non-Docker dev.
        // The /:path* suffix must always be appended to forward the full path.
        destination: `${process.env.BACKEND_URL || 'http://127.0.0.1:8000'}/:path*`,
      },
    ]
  },
  images: {
    domains: ['127.0.0.1', 'localhost'],
  },
};

export default nextConfig;
