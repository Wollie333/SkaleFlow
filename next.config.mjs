/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    // Type checking done separately via `tsc --noEmit` to avoid OOM during build
    ignoreBuildErrors: true,
  },
  eslint: {
    // Linting done separately via `next lint` to avoid OOM during build
    ignoreDuringBuilds: true,
  },
  serverExternalPackages: ['pdf-parse'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kviacenyqktgtgpoignj.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
  async headers() {
    return [
      {
        // Allow camera, microphone, and display-capture on call room pages
        source: '/(call-room|calls)/:path*',
        headers: [
          {
            key: 'Permissions-Policy',
            value: 'camera=*, microphone=*, display-capture=*',
          },
        ],
      },
    ];
  },
};

export default nextConfig;
