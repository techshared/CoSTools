/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@costools/shared-types', '@costools/api-client', '@costools/utils'],
  async rewrites() {
    return [
      { source: '/api/be/profit/:path*', destination: 'http://profit-engine:8001/api/v1/:path*' },
      { source: '/api/be/decision/:path*', destination: 'http://decision-registry:8002/api/v1/:path*' },
      { source: '/api/be/dashboard/:path*', destination: 'http://dashboard:8003/api/v1/dashboard/:path*' },
      { source: '/api/be/contribution/:path*', destination: 'http://contribution-graph:8004/api/v1/contributions/:path*' },
    ]
  },
}
module.exports = nextConfig
