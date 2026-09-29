/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Produces a minimal .next/standalone folder containing only the files
  // needed to run the app (server + resolved node_modules subset), so the
  // Docker image doesn't need to ship the full node_modules or source tree.
  output: 'standalone',
};

module.exports = nextConfig;
