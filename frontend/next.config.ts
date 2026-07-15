import type { NextConfig } from "next";



const nextConfig: NextConfig = {
  serverExternalPackages: ["cloudinary"],
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
