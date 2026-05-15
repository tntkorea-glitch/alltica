#!/bin/bash
# Vercel 환경변수 일괄 등록 스크립트
# 사용법: bash push-env.sh
# 새 Supabase 프로젝트 이관 시 .env.local 수정 후 실행

set -e

echo "=== alltica Vercel 환경변수 등록 ==="

while IFS="=" read -r key value; do
  [[ -z "$key" || "$key" == \#* ]] && continue
  value="${value%#*}"
  value="${value