import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // আউটপুট কনফিগারেশন
  output: 'standalone',
  
  // ইমেজ অপটিমাইজেশন (ঐচ্ছিক)
  images: {
    unoptimized: true,
  },
  
  // বিল্ড টাইম কনফিগারেশন
  staticPageGenerationTimeout: 120,
  
  // রিডাইরেক্ট কনফিগারেশন
  skipTrailingSlashRedirect: true,
  skipMiddlewareUrlNormalize: true,
  
  // Environment variables গুলো ক্লায়েন্টে доступный করুন
  env: {
    NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL || '',
    NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '',
  },
  
  // Webpack কনফিগারেশন (build time error এড়ানোর জন্য)
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Build time এ supabase কে ইগনোর করুন
      config.externals = [...(config.externals || []), 'supports-color']
    }
    return config
  },
  
  // ট্রান্সপাইল প্যাকেজ
  transpilePackages: ['recharts'],
};

export default nextConfig;