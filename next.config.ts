import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      // Default is 1MB, which a real phone camera photo blows past almost
      // every time (submitAttemptPhoto sends the image as base64 in the
      // action body). The client already downscales/compresses before
      // upload (see photo-answer.tsx), so this is headroom for the rare
      // case that doesn't compress much, not a substitute for that.
      bodySizeLimit: "8mb",
    },
  },
};

export default nextConfig;
