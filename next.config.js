const withPWA = require('next-pwa')({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  swcMinify: true,
  webpack: (config, { isServer }) => {
    // Exclude Supabase Edge Functions from webpack compilation
    config.resolve.alias = {
      ...config.resolve.alias,
      // Redirect any imports from supabase/functions to an empty module
      'supabase/functions': false,
    };
    
    // Add externals for Deno-specific modules
    config.externals = config.externals || [];
    config.externals.push({
      'https://deno.land/std@0.168.0/http/server.ts': 'commonjs https://deno.land/std@0.168.0/http/server.ts',
      'https://deno.land/std@0.177.0/http/server.ts': 'commonjs https://deno.land/std@0.177.0/http/server.ts',
    });
    
    // Add a rule to ignore .ts files in supabase/functions directory
    config.module.rules.push({
      test: /supabase\/functions\/.*\.ts$/,
      use: 'ignore-loader',
    });
    
    return config;
  },
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
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = withPWA(nextConfig); 