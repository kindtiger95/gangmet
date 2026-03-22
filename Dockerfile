# ---- 1단계: 의존성 설치 ----
FROM node:20-slim AS deps
WORKDIR /app

COPY package*.json ./
# devDependencies 포함 (prisma CLI, tsx, seed 스크립트 실행에 필요)
RUN npm ci --include=dev


# ---- 2단계: 빌드 ----
FROM node:20-slim AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Prisma Client 생성
RUN npx prisma generate

# Next.js 프로덕션 빌드
RUN npm run build


# ---- 3단계: 실행 ----
FROM node:20-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
# DB 파일 경로 (볼륨 마운트 대상)
ENV DATABASE_URL=file:/data/gangmet.db

# /data 디렉토리 생성 (SQLite DB 저장소)
RUN mkdir -p /data

# 빌드 결과물 복사
COPY --from=builder /app/public          ./public
COPY --from=builder /app/.next           ./.next
COPY --from=builder /app/node_modules    ./node_modules
COPY --from=builder /app/package.json    ./package.json
COPY --from=builder /app/prisma          ./prisma
COPY --from=builder /app/prisma.config.ts ./prisma.config.ts

# 엔트리포인트 스크립트 복사 및 실행 권한 부여
COPY docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# SQLite DB 영속성을 위한 볼륨
VOLUME ["/data"]

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
