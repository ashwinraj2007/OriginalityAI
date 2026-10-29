// Bulletproof NEXTAUTH_URL sanitizer for Vercel builds
function sanitizeAuthUrl() {
  let envUrl = process.env.NEXTAUTH_URL?.trim();
  if (envUrl) {
    try {
      const formatted = envUrl.startsWith('http://') || envUrl.startsWith('https://') 
        ? envUrl 
        : `https://${envUrl}`;
      new URL(formatted);
      return formatted;
    } catch {
      // If invalid, fallback
    }
  }
  if (process.env.VERCEL_URL) {
    return `https://${process.env.VERCEL_URL}`;
  }
  return 'http://localhost:3000';
}

process.env.NEXTAUTH_URL = sanitizeAuthUrl();

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXTAUTH_URL: process.env.NEXTAUTH_URL,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
  },
};

module.exports = nextConfig;
