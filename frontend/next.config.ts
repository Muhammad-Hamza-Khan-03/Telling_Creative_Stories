import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Enable experimental features for better performance
  experimental: {
    optimizePackageImports: ['@xyflow/react', 'lucide-react'],
  },
  
  // API proxy configuration to connect frontend to backend
  async rewrites() {
    return [
      // Proxy all /api/v1/* requests to the FastAPI backend
      {
        source: '/api/v1/:path*',
        destination: process.env.BACKEND_URL + '/api/v1/:path*',
      },
      // Also proxy health checks and other backend routes
      {
        source: '/health',
        destination: process.env.BACKEND_URL + '/health',
      }
    ];
  },

  // Environment variables for different deployment stages
  env: {
    BACKEND_URL: process.env.BACKEND_URL || 'http://localhost:8000',
  },

  // Headers for better security and performance
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
        ],
      },
    ];
  },
};

export default nextConfig;