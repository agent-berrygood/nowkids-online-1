/** @type {import('next').NextConfig} */
const nextConfig = {
    output: 'export',
    // basePath: '/nowkids-online', // GitHub Actions will inject this automatically if using configure-pages
    images: {
        unoptimized: true,
    },
    typescript: {
        ignoreBuildErrors: false,
    },
    eslint: {
        ignoreDuringBuilds: false,
    },
};

export default nextConfig;