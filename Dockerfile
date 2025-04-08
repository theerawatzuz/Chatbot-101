# ใช้ Node.js เวอร์ชัน 20 บน Alpine
FROM node:20-alpine

# ตั้ง working directory
WORKDIR /app

# คัดลอก dependencies และติดตั้ง
COPY package*.json ./
RUN npm install

# คัดลอก source code ที่เหลือ
COPY . .

# Build แอป Next.js
RUN npm run build

# เปิดพอร์ต 3000
EXPOSE 3000

# Start แอป
CMD ["npm", "start"]