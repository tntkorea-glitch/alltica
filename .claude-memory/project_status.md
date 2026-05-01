---
name: 프로젝트 상태
description: alltica 현재 진행 상태 — 환경 요약, 미배포 작업, 배포 전 체크리스트, Phase 2 백로그
type: project
originSessionId: 748b6203-c04d-455a-8603-299ed4a2a4cb
---

> 완성된 기능/완료된 작업 상세는 코드와 `git log`에 있음. 이 문서는 **현재 미완료/미배포/대기 항목만** 추적.

## 핵심 환경 (참조)

- Next.js 16 (`proxy.ts`, middleware.ts 아님) + React 19 + Tailwind v4 + TypeScript
- Supabase ref `omzkzxrncypfluxfwrpg` — 테이블: `applications`/`users`/`seminars`/`submissions`/`app_settings`. Storage: `business-cards`/`submission-files`
- 인증: NextAuth v5 (Google만 활성, 카카오/네이버 placeholder) + admin_session HMAC 쿠키
- OCR: Claude Haiku 4.5 Vision tool_use
- SMS: SolAPI 단문 90B (postica와 크레덴셜 공유)
- 결제: 수동 계좌이체 (`BANK_*` env)
- 도메인: alltica.co.kr (호스팅케이알 DNS) + alltica.vercel.app
- 자동화: Stop 훅 auto-commit (push 안 함) + gitleaks pre-commit + SessionStart git pull

## 환경변수 (`.env.local`)

`ADMIN_PASSWORD` · `AUTH_SECRET` · `ANTHROPIC_API_KEY` · `NEXT_PUBLIC_SUPABASE_URL` · `NEXT_PUBLIC_SUPABASE_ANON_KEY` · `SUPABASE_SERVICE_ROLE_KEY` · `SOLAPI_API_KEY` · `SOLAPI_API_SECRET` · `SOLAPI_SENDER` (01088425659) · `ADMIN_NOTIFY_PHONES` (01088425659) · `BANK_NAME` (기업은행) · `BANK_ACCOUNT_NUMBER` (010-5247-5659) · `BANK_ACCOUNT_NAME` (티엔티코리아) · `AUTH_GOOGLE_ID`/`AUTH_GOOGLE_SECRET` (현재 빈 값 — Google Cloud Console 셋업 필요)

⚠️ VS Code 붙여넣기 자동 들여쓰기 주의 — 모든 키 컬럼 0에서. 값에 따옴표 X (`feedback_env_quotes.md` 참조).

## 사고 기록 (잊으면 안 됨)

**2026-04-21 원격 전체 삭제**: 폴더 리네임 중 빈 디렉토리에서 auto-commit 훅 발동 → 전체 삭제 커밋(`8d4b337`). force-push로 복구(`845ba70`). **교훈**: 폴더 리네임/이동 시 auto-commit 훅 일시 비활성 또는 신중.

## 🟡 로컬 미배포 (다음 `/test` 또는 `/bye`에서 일괄 배포)

### A. 서비스 라인업 admin 게이트 (2026-04-30)
- `src/lib/services.ts` 재배열: 1행 Postica/Beautica/Netica live, 2~3행 Yutica/Liketica/Datica/Contica/Onetica/Novtica coming-soon
- `src/lib/admin-context.ts` 신규 — admin_session 쿠키 OR NextAuth role∈{admin, subadmin}
- `src/components/ServiceLineup.tsx` async + admin 가드 — 일반 유저는 9개 모두 "준비 중", 관리자만 1행 3개 링크 활성
- `src/app/layout.tsx` 푸터 SERVICES 동일 게이트

### B. 일반 문의 폼 Supabase 이관 (2026-05-01)
**Vercel prod 영속화 버그 수정** — 기존 `data/submissions.json` + `public/uploads/`는 서버리스에서 휘발.
- `supabase/schema.sql` — `public.submissions` 테이블 + `submission-files` Storage 버킷 추가
- `src/app/api/submissions/route.ts` 재작성 — Storage 업로드 + jsonb 인서트 / GET은 1시간 서명 URL. 응답 시그니처 동일 (`Submission` 인터페이스 그대로)
- `src/lib/supabase.ts` — `SUBMISSION_FILES_BUCKET` 상수 추가
- `src/lib/storage.ts` 삭제 + `data/submissions.json` 삭제

### C. 어드민 일반문의 탭 엑셀 다운로드 (2026-05-01)
- `exportSubmissionsExcel` + `submissionsToSheet` (`admin/page.tsx`)
- 전체 시트 + formSlug별 시트, 알려진 키 외 응답은 "기타" 컬럼
- 파일명 `alltica-일반문의-YYYY-MM-DD.xlsx`

**검증**: `npx tsc --noEmit` / `npm run lint` / `npm run build` 모두 0 에러, 52 페이지 컴파일.

## 🚨 배포 시 반드시 해야 할 일

1. **Supabase SQL Editor 에서 `supabase/schema.sql` 재실행** — `submissions` 테이블/`submission-files` 버킷이 prod에 없으면 일반 문의 폼 500. CREATE IF NOT EXISTS 라 재실행 안전.
2. 로컬 시각 검증:
   - 서비스 라인업: 시크릿 창에서 9개 모두 "준비 중" / `/admin/login` 후 1행 3개만 활성
   - `/admin` 헤더 겹침 사라졌는지
   - 일반 회원에서 우상단 "마이페이지", admin에서 "관리자" 분기, `/mypage` 동작
   - 명함 OCR `<UNKNOWN>` 안 뜨는지
   - `[우편번호 검색]` 버튼 → Daum 팝업
   - 일반 문의 폼 제출 → `/admin` 📝 일반 문의 탭에서 보이는지 + 엑셀 다운로드

## Phase 2 백로그

- 카카오/네이버 소셜 로그인 실연동 (현재 "준비 중" alert)
- 토스페이먼츠 PG 연동 (수동 계좌이체 → 즉시 결제)
- ~~카카오 알림톡 전환~~ **코드 완료, 비즈니스 심사 대기 중** → 심사 완료 후 아래 "알림톡 활성화 절차" 진행
- 세미나 데이터 실제 내용 교체 (제품교육 5/22, B2B영업 6/5, 디지털광고 6/19 — 3개 플레이스홀더)
- 세미나별 명함 OCR A/B 모니터링 (실패 건 별도 로그)
- 강사/관리자 시스템 로컬 E2E 테스트 (`/teacher/seminars/new` 등록→수정→삭제, 신청자 명단, SMS 오버라이드, subadmin 권한 제약)
- OCR 주소 정확도 — 실제 명함 샘플로 검증, 부족하면 prompt 보강 또는 Sonnet 비교

## 🔔 알림톡 활성화 절차 (비즈니스 심사 완료 후)

코드는 모두 완료됨. 심사 통과 후 아래 3단계만 하면 바로 작동.

1. **Supabase SQL** 실행 (solapi_pf_id 컬럼 추가):
   ```sql
   ALTER TABLE users ADD COLUMN IF NOT EXISTS solapi_pf_id text;
   ```

2. **`.env.local`** 값 채우기 (이미 키는 추가됨, 값만 비어있음):
   ```
   SOLAPI_PF_ID=KA01PF...                        # 솔라피 > 카카오채널 관리 > pfId
   SOLAPI_ALIMTALK_TEMPLATE_APPLICANT=KA01TP...  # 신청자용 템플릿 ID
   SOLAPI_ALIMTALK_TEMPLATE_ADMIN=KA01TP...      # 관리자 알림용 템플릿 ID
   ```

3. **솔라피 알림톡 템플릿 2개 등록** (변수명 정확히 맞춰야 함):
   - 신청자용 변수: `#{이름}` `#{날짜}` `#{금액}` `#{은행}` `#{계좌번호}`
   - 관리자용 변수: `#{이름}` `#{연락처}` `#{날짜}`

**완료된 코드**:
- `src/lib/alimtalk.ts` — 신청자/관리자 알림톡 발송 함수 (SMS 폴백 내장)
- `src/app/api/applications/route.ts` — 알림톡 우선 발송, 실패 시 SMS 자동 전환
- `src/app/api/admin/users/route.ts` · `[id]/route.ts` — `solapi_pf_id` 필드 지원
- `src/app/admin/page.tsx` UsersTab SolapiModal — 강사별 pfId 설정 UI 추가

## 사용자 결정 대기 (자율진행 불가)

- 9개 ~tica 카드 아이콘 — 현재 이모지 임시(📸💇✍️▶️❤️📊📇📤🏢), 정식 로고 자산 필요
- Onetica/Novtica 진행 시점 — 둘 다 "준비 중", 언제 어떤 순서로 만들지
- 카테고리 분류 — Beautica를 "비즈니스", Datica를 단독 "분석"으로 묶음. 다른 분류 원하면 `services.ts` `category` 수정
- Phase 2 우선순위 — 위 백로그 중 다음 무엇부터
