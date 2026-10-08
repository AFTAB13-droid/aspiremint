/** @type {import('next').NextConfig} */
const securityHeaders = [
  // Prevent clickjacking — disallow this site being embedded in iframes
  { key: 'X-Frame-Options', value: 'DENY' },
  // Stop browsers from MIME-sniffing content types
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  // Only send referer for same-origin requests
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  // Block access to camera, mic, geolocation
  { key: 'Permissions-Policy', value: 'camera=(), microphone=(), geolocation=(), payment=()' },
  // Force HTTPS for 1 year (enable only after confirming your domain has SSL)
  { key: 'Strict-Transport-Security', value: 'max-age=31536000; includeSubDomains' },
  // Enable XSS protection in older browsers
  { key: 'X-XSS-Protection', value: '1; mode=block' },
  // DNS prefetch control
  { key: 'X-DNS-Prefetch-Control', value: 'on' },
];

const nextConfig = {
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Apply security headers to all routes
        source: '/(.*)',
        headers: securityHeaders,
      },
    ];
  },
  webpack: (config, { isServer }) => {
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        stream: false,
      };
    }
    return config;
  },
};

export default nextConfig;
