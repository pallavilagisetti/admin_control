/** @type {import('next').NextConfig} */
const nextConfig = {
  // Production optimizations
  output: 'standalone',
  compress: true,
  poweredByHeader: false,
  generateEtags: false,
  
  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()',
          },
        ],
      },
    ];
  },

  // Environment variables
  env: {
    NEXT_PUBLIC_API_URL: process.env.NEXT_PUBLIC_API_URL || 'https://api.your-domain.com',
    NEXT_PUBLIC_APP_NAME: process.env.NEXT_PUBLIC_APP_NAME || 'Upstar Admin Panel',
    NEXT_PUBLIC_APP_VERSION: process.env.NEXT_PUBLIC_APP_VERSION || '1.0.0',
    NEXT_PUBLIC_APP_ENVIRONMENT: process.env.NEXT_PUBLIC_APP_ENVIRONMENT || 'production',
  },

  // Image optimization
  images: {
    domains: ['localhost', 'your-domain.com'],
    formats: ['image/webp', 'image/avif'],
  },

  // Webpack configuration
  webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
    // Production optimizations
    if (!dev && !isServer) {
      config.optimization.splitChunks = {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            test: /[\\/]node_modules[\\/]/,
            name: 'vendors',
            chunks: 'all',
          },
        },
      };
    }

    return config;
  },

  // Experimental features
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ['@/lib/api-client', '@/lib/api-hooks'],
  },

  // Redirects
  async redirects() {
    return [
      {
        source: '/admin',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },

  // Rewrites for API calls
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
      },
    ];
  },
};

module.exports = nextConfig;











