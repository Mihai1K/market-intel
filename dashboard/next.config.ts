import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Кириллический путь до проекта ломает инференс корня Turbopack — фиксируем явно
  turbopack: {
    root: path.join(__dirname),
  },
};

export default nextConfig;
