/** @type {import('next').NextConfig} */
const nextConfig = {
  // สร้างผลลัพธ์แบบ standalone เพื่อให้อิมเมจ Docker มีขนาดเล็ก
  output: "standalone",
};

export default nextConfig;
