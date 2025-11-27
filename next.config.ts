import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    output: 'export', // Cloudflare Pages용 정적 빌드
    images: {
        unoptimized: true, // 정적 export시 필요
    },
    typescript: {
        // 빌드 시 타입 체크 엄격하게
        ignoreBuildErrors: false,
    },
    eslint: {
        ignoreDuringBuilds: false,
    },
};

export default nextConfig;
