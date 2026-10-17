import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true, // Vercel 빌드 시 타입 에러를 무시합니다.
  },
};

export default nextConfig;