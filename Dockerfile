# syntax=docker/dockerfile:1

###############################################################################
# ระบบ MIS แผนกวิชาเทคโนโลยีสารสนเทศ วิทยาลัยเทคนิคเชียงใหม่
# Multi-stage build — อิมเมจสุดท้ายใช้ Next.js standalone output ขนาดเล็ก
###############################################################################

# ---------- 1) ติดตั้ง dependencies ----------
FROM node:20-alpine AS deps
WORKDIR /app

# ติดตั้งเฉพาะ dependencies ก่อน เพื่อให้ layer นี้ถูก cache ไว้เมื่อโค้ดเปลี่ยน
COPY package.json package-lock.json ./
RUN npm ci


# ---------- 2) build แอปพลิเคชัน ----------
FROM node:20-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

ENV NEXT_TELEMETRY_DISABLED=1
RUN npm run build


# ---------- 3) อิมเมจสำหรับใช้งานจริง ----------
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0 \
    TZ=Asia/Bangkok

# ใช้ผู้ใช้ที่ไม่ใช่ root และติดตั้ง tzdata เพื่อให้เวลาไทยถูกต้อง
RUN apk add --no-cache tzdata wget \
 && addgroup --system --gid 1001 nodejs \
 && adduser  --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public

USER nextjs
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://127.0.0.1:3000/api/health || exit 1

CMD ["node", "server.js"]
