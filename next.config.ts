import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
    devIndicators: false,
    reactStrictMode: true,
    output: 'standalone',
    webpack: (config, { dev, isServer }) => {
        if (!dev && !isServer) {
            config.resolve.fallback = {
                ...config.resolve.fallback,
                net: false,
                dns: false,
                tls: false,
                fs: false,
                request: false,
            };
        }
        return config;
    },
};

export default nextConfig;
