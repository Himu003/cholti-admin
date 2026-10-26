import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  poweredByHeader: false,
  reactStrictMode: true,
  productionBrowserSourceMaps: true,
  allowedDevOrigins: [
    "3001-cs-100214279862-default.cs-asia-southeast1-yelo.cloudshell.dev",
    "*.run.pinggy-free.link",
    "*.free.pinggy.net",
  ],
};

export default nextConfig;
