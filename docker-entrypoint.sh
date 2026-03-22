#!/bin/sh
set -e

# DATABASE_URL=file:/data/gangmet.db 기준으로 파일 경로 추출
DB_FILE="${DATABASE_URL#file:}"

if [ ! -f "$DB_FILE" ]; then
  echo "[gangmet] DB 파일이 없습니다. 초기화를 시작합니다..."
  npx prisma db push --skip-generate
  npx prisma db seed
  echo "[gangmet] DB 초기화 완료."
else
  echo "[gangmet] 기존 DB를 사용합니다: $DB_FILE"
fi

echo "[gangmet] 서버를 시작합니다..."
exec npx next start
