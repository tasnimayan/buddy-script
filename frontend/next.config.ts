import type { NextConfig } from "next";

function backendRewriteDestination(): string {
  const base = (
    process.env.BACKEND_API_URL ?? "http://localhost:4000/api/v1"
  ).replace(/\/$/, "");
  // Env may be either `http://host:port` or `http://host:port/api/v1`.
  return /\/api\/v1$/.test(base)
    ? `${base}/:path*`
    : `${base}/api/v1/:path*`;
}

const nextConfig: NextConfig = {
  serverExternalPackages: ["cloudinary"],
  async rewrites() {
    return [
      {
        source: "/api/v1/:path*",
        destination: backendRewriteDestination(),
      },
    ];
  },
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
    ],
  },
};

export default nextConfig;
