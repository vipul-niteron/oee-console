/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
    WATI_ACCESS_TOKEN: process.env.WATI_ACCESS_TOKEN,
    WATI_API_ENDPOINT: process.env.WATI_API_ENDPOINT,
    WATI_WHATSAPP_NUMBER: process.env.WATI_WHATSAPP_NUMBER,
  },
  // Add server-side environment variables
  serverRuntimeConfig: {
    TWILIO_ACCOUNT_SID: process.env.TWILIO_ACCOUNT_SID,
    TWILIO_AUTH_TOKEN: process.env.TWILIO_AUTH_TOKEN,
    TWILIO_PHONE_NUMBER: process.env.TWILIO_PHONE_NUMBER,
    WATI_ACCESS_TOKEN: process.env.WATI_ACCESS_TOKEN,
    WATI_API_ENDPOINT: process.env.WATI_API_ENDPOINT,
    WATI_WHATSAPP_NUMBER: process.env.WATI_WHATSAPP_NUMBER,
  },
  // Add build configuration
  distDir: '.next',
  generateBuildId: async () => {
    return 'build-' + Date.now();
  },
  // Add security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
        ],
      },
    ];
  },
}

module.exports = nextConfig
