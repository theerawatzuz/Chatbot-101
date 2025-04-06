/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["172.20.10.9"], // เพิ่ม IP ที่ต้องการอนุญาต
  output: "standalone",
};

module.exports = nextConfig;
