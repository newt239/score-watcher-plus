import type { NextConfig } from "next";

import { withSentryConfig } from "@sentry/nextjs";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  // 旧オンライン版URL（/online/...）からの恒久リダイレクト
  redirects: async () => {
    return [
      {
        source: "/online",
        destination: "/games",
        permanent: true,
      },
      {
        source: "/online/:path*",
        destination: "/:path*",
        permanent: true,
      },
    ];
  },
  webpack: (config) => {
    config.infrastructureLogging = {
      level: "error",
    };

    // パフォーマンス警告を抑制
    config.performance = {
      hints: false,
    };

    return config;
  },
};

export default withSentryConfig(nextConfig, {
  org: "newt239",
  project: "score-watcher",
  silent: !process.env.CI,
  telemetry: false,
  widenClientFileUpload: true,
  tunnelRoute: "/monitoring",
  webpack: {
    treeshake: {
      removeDebugLogging: true,
    },
    automaticVercelMonitors: true,
  },
});
