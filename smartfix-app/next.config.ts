import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // The Supabase CA path is configured at runtime through DB_SSL_CA_FILE.
  // Next.js cannot infer dynamic readFileSync paths while tracing serverless
  // dependencies, so keep the certificate in every Vercel function bundle.
  outputFileTracingIncludes: {
    "/*": [
      "./certs/prod-ca-2021.crt",
      // Sequelize resolves the PostgreSQL dialect with a dynamic require.
      // Include the driver tree explicitly so Vercel packages it with every
      // server function that imports the shared database configuration.
      "./node_modules/pg/**/*",
      "./node_modules/pg-*/**/*",
      "./node_modules/postgres-*/**/*",
    ],
  },
  serverExternalPackages: [
    "sequelize",
    "pg",
    "pg-hstore",
  ],
  async headers() {
    const scriptSource = process.env.NODE_ENV === "development"
      ? "script-src 'self' 'unsafe-inline' 'unsafe-eval'"
      : "script-src 'self' 'unsafe-inline'";
    const securityHeaders = [
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "base-uri 'self'",
          "form-action 'self' https://www.mercadopago.com.br https://www.mercadopago.com",
          "frame-ancestors 'none'",
          "object-src 'none'",
          scriptSource,
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: blob: https:",
          "font-src 'self' data:",
          "connect-src 'self' https: wss:",
          "upgrade-insecure-requests",
        ].join("; "),
      },
      { key: "X-Content-Type-Options", value: "nosniff" },
      { key: "X-Frame-Options", value: "DENY" },
      { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
      { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
      { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
      {
        key: "Permissions-Policy",
        value: "camera=(), microphone=(), geolocation=(self)",
      },
    ];

    if (process.env.NODE_ENV === "production") {
      securityHeaders.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains",
      });
    }

    return [
      { source: "/(.*)", headers: securityHeaders },
      {
        source: "/api/:path*",
        headers: [
          { key: "Cache-Control", value: "no-store, max-age=0" },
          { key: "X-Robots-Tag", value: "noindex, nofollow" },
        ],
      },
    ];
  },
};

export default nextConfig;
