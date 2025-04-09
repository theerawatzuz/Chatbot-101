/** @type {import('next').NextConfig} */
const nextConfig = {
  allowedDevOrigins: ["172.20.10.9"], // เพิ่ม IP ที่ต้องการอนุญาต
  output: "standalone",
  // เพิ่ม configuration เพื่อไม่เก็บ cache
  generateBuildId: async () => {
    // สร้าง build ID ใหม่ทุกครั้ง
    return Date.now().toString();
  },
  // ปิดการใช้งาน cache ใน production
  onDemandEntries: {
    maxInactiveAge: 60 * 60 * 1000, // 1 ชั่วโมง
    pagesBufferLength: 5,
  },
  // ปิดการใช้งาน static cache
  experimental: {
    disableOptimizedLoading: true,
  },
};

module.exports = nextConfig;
