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
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'kviacenyqktgtgpoignj.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};

export default nextConfig;
