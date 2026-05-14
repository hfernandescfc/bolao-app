import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Permite importações de servidores externos de imagem (ex: flags)
  images: {
    remotePatterns: [],
  },
};

export default nextConfig;
