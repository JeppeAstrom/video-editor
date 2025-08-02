import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  api: {
    bodyParser: false,
  },
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },
};

export default nextConfig;
