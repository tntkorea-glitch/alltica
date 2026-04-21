---
name: 프로젝트 상태
description: alltica 현재 진행 상태 및 다음 작업
type: project
originSessionId: 748b6203-c04d-455a-8603-299ed4a2a4cb
---
## 현재 상태 (2026-04-21)
통합 신청센터 사이트 구축 완료 + 배포 완료.
프로젝트 리네임: seminar-app → alltica (2026-04-21). 폴더 `D:\dev\alltica`로 이동 완료.

**완성된 기능:**
- 풀스크린 히어로 랜딩 페이지 (Class101/MoneyUpClass/윤자동 벤치마킹 디자인)
- 5개 신청서 폼: 세미나/교육, 제품 구매, 인력 모집, 파트너 신청, 일반 문의
- 동적 폼 렌더러 (text, tel, email, textarea, select, checkbox, date, number, file 지원)
- 파일 업로드 (public/uploads/)
- 관리자 대시보드 (/admin)
- 관리자 인증: 환경변수(ADMIN_PASSWORD) 기반, 서버 API(/api/auth)로 검증
- API 보안: Authorization 헤더(Bearer) 방식으로 submissions 조회
- 파일 기반 JSON 스토리지 (data/submissions.json)
- 스크롤 반응 헤더, 카카오톡 플로팅 버튼
- 자동 커밋/푸시 훅 + gitleaks pre-commit hook
- Vercel 배포 완료 (도메인: alltica.vercel.app)

**Why:** 기존 Tally/네이버폼 8개+ 분산된 신청서를 하나로 통합하기 위함.

## 리네임 완료 (2026-04-21)
- GitHub repo: `seminar-app` → `alltica` ✅
- 로컬 remote URL: `https://github.com/tntkorea-glitch/alltica.git` ✅
- Vercel 프로젝트명 + 도메인: `alltica.vercel.app` ✅

## 주의: 2026-04-21 원격 전체 삭제 사고
다른 PC에서 폴더 리네임 중 원본 폴더 비워진 채로 auto-commit이 발동,
전체 파일 삭제 커밋(`8d4b337`)이 원격에 push됨. 이 PC에서 force-push로 복구(`845ba70`).
**교훈:** 폴더 리네임/이동 시 auto-commit 훅이 빈 디렉토리를 푸시하지 않도록 주의.

## Phase 1 MVP 진행 (2026-04-21 착수)

**목표:** 세미나 신청 자체 양식 (Tally/네이버폼 대체) + 명함 OCR 자동입력 + SMS 알림 + 계좌이체 수동 안내.

**구현된 코드 (2026-04-21, 빌드 통과):**
- `supabase/schema.sql` — applications 테이블 + business-cards Storage 버킷 + RLS
- `src/lib/seminars.ts` — 하드코딩 세미나 4개 (MVP용 플레이스홀더)
- `src/lib/supabase.ts` — admin/public 클라이언트 분리
- `src/lib/sms.ts` — SolAPI SMS 추상화 (sendSms/sendSmsSafe)
- `src/lib/ocr.ts` — Claude Vision (claude-haiku-4-5) tool_use 로 명함 구조화 추출
- `src/app/api/ocr/business-card/route.ts` — OCR 엔드포인트
- `src/app/api/applications/route.ts` — 신청 저장 + 명함 Storage 업로드 + SMS 발송 (신청자 + 관리자)
- `src/app/seminars/page.tsx` — 세미나 목록
- `src/app/seminars/[slug]/page.tsx` — 세미나 상세 (비용/커리큘럼/추천대상)
- `src/app/seminars/[slug]/apply/page.tsx` — 신청 폼 페이지
- `src/app/seminars/[slug]/apply/complete/page.tsx` — 접수 완료 + 계좌이체 안내
- `src/components/SeminarCard.tsx`, `src/components/SeminarApplyForm.tsx`
- `src/app/page.tsx` — 홈에 "진행 중인 세미나" 섹션 + 히어로 CTA 변경
- `.env.example` 작성 (Supabase/Anthropic/SolAPI/은행계좌 키 명세)

**의사결정 기록:**
- OCR: Claude Vision (Anthropic 계정 기 보유, 한국어 명함 인식 우수)
- DB: Supabase (타 프로젝트 계정 보유 → alltica 전용 새 프로젝트 권장)
- 알림: SolAPI **SMS** (postica 에 이미 셋업됨, 크레덴셜 재사용). 알림톡은 사용자가 카카오 승인 미신청 상태.
- 결제: Phase 1 은 계좌이체 수동 안내만. PG(토스페이먼츠) 는 Phase 2.
- 효성CMS 는 정기출금이라 세미나 1회성 결제에 부적합 → 범위 제외.
- 세미나 데이터: 하드코딩 파일 (MVP), 세미나 수 많아지면 Supabase `seminars` 테이블 + 관리자 CRUD 로 이관.

## 2026-04-21 원격 전체 삭제 사고
다른 PC에서 폴더 리네임 중 원본 폴더 비워진 채로 auto-commit이 발동,
전체 파일 삭제 커밋(`8d4b337`)이 원격에 push됨. 이 PC에서 force-push로 복구(`845ba70`).
**교훈:** 폴더 리네임/이동 시 auto-commit 훅이 빈 디렉토리를 푸시하지 않도록 주의.

## Next up (사용자 준비물 + Phase 2)
**사용자가 준비해야 실제 작동:**
1. Supabase 새 프로젝트 생성 → URL / anon key / service_role key 제공
2. Supabase SQL Editor 에 `supabase/schema.sql` 실행
3. Anthropic API 키 발급 → 환경변수
4. postica SolAPI 크레덴셜 (API Key/Secret/발신번호) alltica `.env.local` 에 복사
5. 은행 계좌 정보 (BANK_NAME/BANK_ACCOUNT_NUMBER/BANK_ACCOUNT_NAME) 입력
6. ADMIN_NOTIFY_PHONES 관리자 수신번호 설정

**Phase 2 작업:**
- 토스페이먼츠 PG 연동 (즉시 카드/간편결제)
- 카카오 비즈니스 채널 + 알림톡 템플릿 승인 → 알림톡 전환
- 커스텀 도메인 (alltica.co.kr 등)
- 세미나 관리자 CRUD (하드코딩 → Supabase)
- 세미나 실제 데이터로 교체 (현재 플레이스홀더)
