import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
    // output: 'export', // Vercel 배포를 위해 제거 (SSR 사용)
    // images: {
    //     unoptimized: true, // Vercel Image Optimization 사용
    // },
    typescript: {
        // 빌드 시 타입 체크 엄격하게
        ignoreBuildErrors: false,
    },
    eslint: {
        ignoreDuringBuilds: false,
    },
};

export default nextConfig;
