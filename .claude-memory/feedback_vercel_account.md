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
- `.vercel/project.json` 올바른 값: `orgId: "a01092935659-s-projects"`, `projectId: "prj_tPXxYGm84RwTwXYLOHS5l0Gwuihy"`
- 배포 전 `npx vercel whoami`로 `a01092935659` 계정인지 확인
- CLI 재인증 필요 시: `npx vercel login` (브라우저 자동 오픈 안되면 토큰 방식 사용)
