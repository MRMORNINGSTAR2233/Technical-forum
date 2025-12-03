/** @type {import('next').NextConfig} */
const path = require('path');

const nextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '2mb',
    },
  },
  images: {
    domains: ['localhost'],
  },
  outputFileTracingRoot: path.join(__dirname, './'),
};

module.exports = nextConfig;
