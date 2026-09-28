/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false, // Prevents double camera mount in dev mode
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
