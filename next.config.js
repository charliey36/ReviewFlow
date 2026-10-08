/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Produces a minimal .next/standalone folder containing only the files
  // needed to run the app (server + resolved node_modules subset), so the
  // Docker image doesn't need to ship the full node_modules or source tree.
  output: 'standalone',
  // Always fetch fresh data when navigating between sections (no stale 30s page cache),
  // so clicking a sidebar item doesn't need a second refresh request.
  experimental: { staleTimes: { dynamic: 0, static: 30 } },
};

module.exports = nextConfig;
