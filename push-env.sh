#!/bin/bash
# Vercel 환경변수 일괄 등록 스크립트
# 사용법: bash push-env.sh
# 새 Supabase 프로젝트 이관 시 .env.local 수정 후 실행

set -e

echo "=== alltica Vercel 환경변수 등록 ==="

while IFS='=' read -r key value; do
  [[ -z "$key" || "$key" == \#* ]] && continue
  value="${value%%#*}"
  value="${value%"${value##*[![:space:]]}"}"

  echo "  → $key"
  echo "$value" | vercel env add "$key" production --force 2>/dev/null || \
  echo "$value" | vercel env add "$key" production
done < .env.local

echo ""
echo "완료! Vercel 대시보드에서 확인하세요."
echo "변경 반영을 위해 재배포가 필요합니다."
