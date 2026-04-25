---
name: 프로젝트 상태
description: alltica 현재 진행 상태 및 다음 작업
type: project
originSessionId: 748b6203-c04d-455a-8603-299ed4a2a4cb
---
## 현재 상태 (2026-04-21)

alltica = 통합 신청센터 + 세미나 신청 시스템. 도메인 `alltica.co.kr` 연결 완료 (호스팅케이알 DNS, Vercel A 레코드 `216.150.1.1`).

**핵심 환경:**
- Next.js 16.2.3 + React 19.2.4 + Tailwind v4 + TypeScript
- Supabase (프로젝트 ref `omzkzxrncypfluxfwrpg`) — applications, app_settings 테이블 + business-cards Storage 버킷
- OCR: Claude Vision (Haiku 4.5, tool_use)
- SMS: SolAPI (단문 90B 강제, postica와 크레덴셜 공유)
- 결제: 계좌이체 수동 (국민은행 / 티엔티코리아 / `BANK_*` env)
- 배포: Vercel (alltica.vercel.app + alltica.co.kr)
- 자동 커밋/푸시 훅 (Stop 이벤트) + gitleaks pre-commit

## 완성된 기능 (Phase 1 MVP — 2026-04-21)

**세미나 신청 시스템:**
- `/seminars` 목록, `/seminars/[slug]` 상세, `/seminars/[slug]/apply` 신청 폼, `/apply/complete` 접수완료+계좌안내
- 세미나 7개(postica 인스타 자동화, 4/27 월 + 4/28~30 오전/오후) + 제품교육 5/22 + B2B영업 6/5 + 디지털광고 6/19. 전부 대구 수성구 두산동 교육장 2층.
- postica 세미나: 노태영 대표 / 10,000원 / 정원 20명 / 인스타 자동화 주제
- 명함 업로드 시 Claude Vision 으로 OCR → 이름/회사/직책/연락처/이메일/주소 자동 채움 + 검토/수정 가능
- 연락처 자동 하이픈 포매터 (`src/lib/phone.ts`)
- Supabase applications 저장, 명함 이미지 Storage 업로드 (서명 URL)
- SolAPI SMS 발송: 신청자(접수완료+계좌안내) + 관리자. `src/lib/sms.ts` 의 `byteLength`/`truncateToBytes`로 단문 90B 강제 (초과시 자동 trim)

**관리자 페이지 (`/admin`):**
- 탭 구조: 🎓 세미나 신청 / 📝 일반 문의 / ⚙️ 설정
- 세미나 탭: 제목별 통계 카드(postica 7세션 합산 표시) / 검색 / 상세 모달(명함 미리보기) / xlsx 엑셀 다운로드(전체 + 제목별 시트)
- 설정 탭: 6가지 스킨(네이비/피치블룸/민트프레시/라벤더/선셋글로우/오션브리즈) 카드, 클릭 시 Supabase `app_settings.theme`에 저장 + 전체 사이트 반영

**테마 시스템:**
- Tailwind v4 `@theme inline`으로 `--color-brand` 등을 CSS 변수(`--theme-brand`)로 매핑
- `[data-theme="..."]` 셀렉터로 6개 팔레트 정의 in `globals.css`
- `layout.tsx`에서 SSR 시 Supabase 조회 → `<html data-theme="X">` 주입
- 69개 하드코딩 hex(`#1e3a5f` 등) 전부 `brand`/`brand-hover`/`brand-deep`/`brand-light` 토큰으로 교체됨

**OG 메타 (카톡/SNS 링크 미리보기):**
- `src/app/opengraph-image.tsx` — ImageResponse로 1200x630 동적 생성(Alltica 브랜딩)
- `layout.tsx` metadata 에 `metadataBase` + `openGraph` + `twitter` 설정

**브랜딩 통일:**
- "통합 신청센터" → "Alltica"
- "알티카" → "Alltica"
- "인력" → "인재"

**리네임 완료 (2026-04-21):**
- GitHub repo: `seminar-app` → `alltica`
- Vercel 프로젝트명 + 도메인: `alltica.vercel.app`
- 커스텀 도메인: `alltica.co.kr` (호스팅케이알)

## 환경변수 (`.env.local` — 민감값은 여기서만 보관)
- `ADMIN_PASSWORD`
- `ANTHROPIC_API_KEY`
- `NEXT_PUBLIC_SUPABASE_URL` / `NEXT_PUBLIC_SUPABASE_ANON_KEY` / `SUPABASE_SERVICE_ROLE_KEY`
- `SOLAPI_API_KEY` / `SOLAPI_API_SECRET` / `SOLAPI_SENDER` (01088425659)
- `ADMIN_NOTIFY_PHONES` (01088425659)
- `BANK_NAME` (기업은행) / `BANK_ACCOUNT_NUMBER` (010-5247-5659) / `BANK_ACCOUNT_NAME` (티엔티코리아)

> ⚠️ VS Code 가 붙여넣기 시 자동 들여쓰기를 하면 `.env` 파서가 키를 인식 못 함. 모든 키는 반드시 컬럼 0에서 시작해야 함.

## 중요 사고 기록

**2026-04-21 원격 전체 삭제 사고:**
다른 PC에서 폴더 리네임 중 원본 폴더가 비워진 채로 auto-commit 훅이 발동 → 전체 파일 삭제 커밋(`8d4b337`)이 원격에 push됨. 이 PC에서 force-push로 복구(`845ba70`).
**교훈:** 폴더 리네임/이동 시 auto-commit 훅이 빈 디렉토리를 푸시하지 않도록 주의.

## Next up when resuming (2026-04-25~)

**우선 — 오늘 새로 만든 기능 실사용 테스트 (로컬):**
1. `/teacher/seminars/new` 에서 테스트 세미나 등록 → 홈/목록 반영 확인 → 수정 → 삭제까지 엔드투엔드
2. 세미나 신청자 생겼을 때 `/teacher/seminars/[id]/applicants` 에서 명단 조회 + 명함 미리보기
3. 세미나별 발신/수신 번호 다르게 설정한 뒤 신청해서 해당 번호로 SMS 가는지
4. 서브관리자 계정 시뮬레이션 (본인을 subadmin 으로 내려서 admin 승격 시도 → 403 확인)
5. 기존 세미나 신청 플로우 회귀 (홈 → postica 신청 → OCR → 접수완료)

**배포 전 작업 (내일 원격 배포하려면 필요):**
- Vercel production env 동기화 — `vercel env ls` 결과 ADMIN_PASSWORD + AUTH_SECRET + AUTH_GOOGLE_ID/SECRET 외 **Supabase 3개, ANTHROPIC_API_KEY, SolAPI 3개, ADMIN_NOTIFY_PHONES, BANK 3개가 누락** 상태. 이대로 배포하면 OCR/SMS/계좌 안내 전부 실패
- Google OAuth 승인된 리디렉션 URI 에 `alltica.co.kr`, `alltica.vercel.app` 둘 다 들어있는지 확인
- **중요**: 오늘 6개 커밋 `git push` 완료 → Vercel 자동배포 트리거됨. env 누락으로 프로덕션 세미나 조회/신청이 500 뜰 수 있음 (로컬 DB 의존). 긴급하면 Vercel 대시보드에서 이전 배포로 롤백 후 env 세팅 먼저

**Phase 2 기능 (우선순위 낮음):**
- 카카오/네이버 소셜 로그인 실연동 (현재 버튼만, "준비 중" alert)
- 토스페이먼츠 PG 연동 (즉시 카드/간편결제). 수동 계좌이체 UX 축소
- 카카오 알림톡 전환 (`src/lib/sms.ts` type 분기 추가)
- 일반 문의/제품/인재/파트너 폼 (`/api/submissions`) 파일 → Supabase 이관 — 현재 프로덕션 동작 안 함
- 세미나 데이터 실제 내용으로 교체 (제품교육/B2B영업/디지털광고 3개는 플레이스홀더)

**Phase 2 기능:**
- 토스페이먼츠 PG 연동 (즉시 카드/간편결제). 수동 계좌이체 UX 축소
- 카카오 비즈니스 채널 신청 → 알림톡 템플릿 승인 → SolAPI SMS → 알림톡 전환 (`src/lib/sms.ts` 에 type 분기 추가)
- 세미나 관리자 CRUD (하드코딩 `src/lib/seminars.ts` → Supabase `seminars` 테이블)
- 세미나 데이터 실제 내용으로 교체 (postica 외 나머지 3개는 여전히 플레이스홀더)
- 세미나별 명함 OCR 정확도 A/B 모니터링 (OCR 실패 건 별도 로그)
- 카카오/네이버 로그인 실연동 (현재 버튼만 있고 "준비 중" alert)

## 2026-04-24 작업 (로그인/관리자/강사 시스템)

**역할 체계 (`users.role` enum):**
`user` → `instructor` → `subadmin` → `admin` 의 4계층. DB 제약(`users_role_check`)에 명시. `src/lib/auth.ts` 의 `UserRole` 타입과 동기화.

**권한 매트릭스:**
| 역할 | `/admin` | `/teacher` | role 변경 |
|---|---|---|---|
| user | ❌ | ❌ | — |
| instructor | ❌ | 본인 세미나만 CRUD + 신청자 조회 | — |
| subadmin | ✅ | 전체 세미나 | user/instructor/subadmin 간 변경. admin 승격/강등 불가 |
| admin | ✅ | 전체 세미나 | 전체 권한 |

**세미나 Supabase 이관 완료:**
- 하드코딩 `src/lib/seminars.ts` 배열 → `public.seminars` 테이블. 10개 시드 완료 (`scripts/seed-seminars.ts` 참고)
- `src/lib/seminars.ts` 는 이제 async Supabase 조회. `getAllSeminars` / `getOpenSeminars` / `getSeminarBySlug` / `getSeminarsByInstructor` 제공
- 기존 10개 consumer 파일 전부 async 대응. `generateStaticParams` 는 DB 쿼리, `dynamicParams = true` 로 새 세미나도 SSG 없이 접근 가능
- admin 페이지는 `/api/seminars` 공개 엔드포인트로 조회 (서버 컴포넌트 아니라서)

**세미나별 SMS 오버라이드:**
`seminars.instructor_sender_phone` / `instructor_notify_phones` 값이 있으면 `SOLAPI_SENDER` / `ADMIN_NOTIFY_PHONES` 대신 사용. 강사가 자기 번호로 송수신 설정 가능.

**/teacher 대시보드:**
- `/teacher` 본인 세미나 목록 (admin/subadmin 은 전체)
- `/teacher/seminars/new` 등록 폼 — 슬러그/일시/장소/가격/정원/커리큘럼/대상/태그/발신번호/수신번호 입력
- `/teacher/seminars/[id]` 수정 + 삭제
- `/teacher/seminars/[id]/applicants` 신청자 명단 + 명함 이미지 (서명 URL)
- 서버 컴포넌트 role 가드. 로그아웃 상태면 `/login` 리다이렉트

**관리자 사용자 탭 (`/admin` > 👥 사용자):**
- Supabase `users` 전체 조회, role 드롭다운 + 연락처 인라인 편집
- API: `GET /api/admin/users`, `PATCH /api/admin/users/[id]` (role/phone 변경)
- subadmin 권한 제약: API 에서 `isFullAdmin()` 체크. admin 으로 승격이나 admin 계정 수정 시도 → 403

**Header 강사 링크:**
`session.user.role ∈ {instructor, subadmin, admin}` 이면 🎓 강사 링크 노출

**인증 이중 게이트 (/admin):**
`src/proxy.ts` 가 두 가지 허용 — (1) `admin_session` 쿠키 (password 로 로그인한 경우), (2) NextAuth 세션 role ∈ {admin, subadmin}. API 라우트들도 `isAdminRequest` 동일 로직.

## 로그인/관리자 인증 (2026-04-24 추가)

**사용자 로그인 — NextAuth v5 JWT:**
- `next-auth@5.0.0-beta.31` 설치, `src/lib/auth.ts` 에 `handlers/auth/signIn/signOut` export
- 현재 활성 provider: **Google 만**. 카카오/네이버 버튼은 `/login` 페이지에 있으나 클릭 시 "준비 중" alert
- Google 첫 로그인 시 `signIn` 콜백에서 Supabase `users` 테이블에 자동 insert (role=user), 재로그인 시 last_login_at 갱신
- JWT 콜백에서 Supabase 조회해 `token.id` / `token.role` 주입 → 세션에 `user.id` / `user.role` 노출
- `.env.local` 에 `AUTH_SECRET` 자동생성값 들어있음. `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` 은 빈 값 — **Google Cloud Console 셋업 필요**
- Google OAuth 리디렉션 URI: `http://localhost:3008/api/auth/callback/google` / `https://alltica.co.kr/api/auth/callback/google`

**관리자 인증 — httpOnly 쿠키 + HMAC 서명:**
- 기존 `/api/auth` 엔드포인트 삭제
- `/api/admin/login` (POST, password 검증 → `admin_session` 쿠키 발급, 7일 TTL) + `/api/admin/logout`
- 토큰 포맷: `<exp>.<base64url(HMAC-SHA256(AUTH_SECRET, "admin."+exp))>` (`src/lib/admin-session.ts`)
- **Next.js 16 `proxy.ts`** (`src/proxy.ts`) 가 `/admin/*` 가드 — 쿠키 없거나 만료 시 `/admin/login?next=...` 으로 리다이렉트
- 백엔드 API (`/api/applications`, `/api/submissions`, `/api/settings/theme`) 는 `isAdminRequest(request)` 헬퍼로 쿠키 검증 — 기존 `Authorization: Bearer <pw>` 헤더 방식 완전 제거
- 관리자 페이지는 더 이상 `authenticated` 클라이언트 state 없음. 새로고침해도 쿠키 유효하면 유지됨

**Supabase 스키마 변경:**
- `public.users` 테이블 추가 (id, email unique, name, image, provider, role enum(user|admin), last_login_at, created/updated_at)
- RLS 활성, service_role 에서만 조작 — **Supabase SQL Editor 에서 `supabase/schema.sql` 재실행 필요 (CREATE IF NOT EXISTS 라 안전)**

**Next.js 16 주의:**
- `middleware.ts` 대신 `proxy.ts` (v16.0.0에서 개명). `export const config = { matcher }` 는 허용, 하지만 `runtime` 등 기타 필드는 금지 (proxy는 항상 Node.js 런타임)

**알려진 제약:**
- 기존 `/api/submissions` 는 여전히 파일 기반(`data/submissions.json`, `public/uploads/`) → Vercel 서버리스에서 실제로 저장 안 됨. 세미나가 아닌 "일반 문의/제품/파트너" 폼은 프로덕션에서 동작 안 하는 상태. 필요해지면 `applications`와 동일하게 Supabase로 이관 필요.
