---
name: .env에 따옴표 쓰지 말기 (Vercel runtime은 strip 안 함)
description: dotenv는 따옴표 strip하지만 Vercel/CI runtime은 raw 값 그대로 쓰므로 .env의 KEY="value" 형식이 prod에서 invalid_client 등 인증 실패 유발
type: feedback
originSessionId: 1d1e8563-cfbe-4a11-b56d-f5debf4f284c
---
`.env.local` 등 환경변수 파일에서 값을 따옴표로 감싸지 말 것 (`KEY=value` ✅, `KEY="value"` ❌).

**Why:** dotenv 파서는 따옴표를 strip 해주지만, Vercel runtime / GitHub Actions / 일반 process.env 주입은 strip 안 함. 그래서 로컬 dev 에서는 멀쩡히 동작하다가 프로덕션에서만 깨지는 미스터리 버그가 생김. 2026-04-27에 alltica 프로젝트에서 `AUTH_GOOGLE_ID="939335..."` 가 Vercel에 따옴표 포함된 채 들어가 Google이 client_id 인식 못해 `invalid_client` 발생. 따옴표 제거 후 즉시 해결.

**How to apply:**
- `.env.local` / `.env.example` 새로 작성하거나 키 추가할 때 따옴표 없이 쓰기
- `vercel env add` 로 push할 때 stdin 값에서 surrounding quotes strip 처리
- 인증/OAuth/SDK 키가 프로덕션에서만 깨지는 증상 → 가장 먼저 .env 파일 따옴표 의심
- 값에 공백/특수문자가 진짜 있을 때만 따옴표 사용 (이 경우 escape 처리도 같이 검토)
