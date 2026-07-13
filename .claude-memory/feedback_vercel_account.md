---
name: feedback_vercel_account
description: alltica 프로젝트의 Vercel 배포 계정은 반드시 a01092935659 (개인 Hobby) 고정
metadata: 
  node_type: memory
  type: feedback
  originSessionId: 7aa17396-7a5e-45f6-b4fc-c5dfba97fc36
---

이 프로젝트(/bye, /save, vercel 배포)는 반드시 Vercel 개인 계정 `a01092935659` (Hobby)에만 배포한다.

**Why:** tnt-mall과 계정이 섞여 꼬인 적 있음. tnt-mall은 별도 계정으로 분리 완료. alltica는 a01092935659 고정.

**How to apply:**
- `/bye` 또는 `npx vercel --prod` 실행 전 `.vercel/project.json`의 `orgId`가 팀 계정(`team_tlz48...`)이 아닌지 확인
- 현재 `.vercel/project.json` → `orgId: team_tlz48DHPiwm1LZkXYtpFO3pG` 는 잘못된 값 → 재링크 필요 (npx vercel link → a01092935659 > alltica 선택)
- Vercel CLI 로그인 계정이 a01092935659인지 먼저 확인 후 배포
