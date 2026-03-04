import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Keep dev pages hot longer to reduce recompile churn on slower disks/synced folders.
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000,
    pagesBufferLength: 8,
  },
};

export default nextConfig;
