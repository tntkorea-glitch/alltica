#!/bin/bash
# Vercel 환경변수 일괄 등록 스크립트
# 사용법: bash push-env.sh

set -e

echo "=== alltica Vercel 환경변수 등록 ==="

while IFS="=" read -r key value; do
  [[ -z "$key" || "$key" == \#* ]] && continue
  # 인라인 주석 제거
  value="${value%%#*}"
  # 앞뒤 공백 제거
  value="${value#"${value%%[! ]*}"}"
  value="${value%"${value##*[! ]}"}"
  # 앞뒤 큰따옴표 제거 (Vercel에 raw 값으로 등록)
  value="${value#\"}"
  value="${value%\"}"
  [[ -z "$key" ]] && continue

  echo "  -> $key"
  echo "$value" | vercel env add "$key" production --force 2>/dev/null || \
  echo "$value" | vercel env add "$key" production
done < .env.local

echo ""
echo "완료! Vercel 대시보드에서 확인하세요."
