/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  reactStrictMode: true,
  webpack: (config) => {
    // Alias react-router-dom to a local shim to keep existing components working
    config.resolve.alias['react-router-dom'] = path.resolve(__dirname, 'src/router-shim.tsx');
    return config;
  },
};

module.exports = nextConfig;