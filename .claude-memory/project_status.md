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

## 2026-04-30 작업 — 알티카 ecosystem 정체성 정렬 (자율진행)

사용자가 "알티카는 9개 ~tica 서비스의 통합 허브" 라는 정체성을 메인페이지에 노출하라고 지시. 라인업 확정(`project_lineup.md` 참조) 후 자율진행으로 다음 작업 완료:

**신규/수정 파일:**
- `src/lib/services.ts` — 9개 서비스 데이터 (브랜드/카테고리/URL/상태) + 카테고리별 스타일 토큰. ServiceLineup, Footer 등이 import해서 단일 소스로 사용.
- `src/components/ServiceLineup.tsx` — 9개 카드 그리드 (4가지 카테고리 색상). 라이브 서비스는 `target=_blank` 이동, 준비 중은 비활성. id=`#services` 앵커.
- `src/app/page.tsx` — Hero 바로 아래에 ServiceLineup 삽입. Hero 카피/CTA 갱신:
  - 헤드라인: "모든 신청, 한 곳에서" → "모든 비즈니스, 한 플랫폼에서"
  - 서브카피: 9개 ~tica 브랜드 나열
  - 1차 CTA: "🚀 전체 서비스 둘러보기" → `#services` (신규 1차)
  - 2차 CTA: "🎓 세미나 신청" → `/seminars`
  - 스탯: "5+ 신청서 유형" → "9 통합 서비스"
  - scroll indicator: `#forms` → `#services`
- `src/components/Header.tsx` — 데스크톱/모바일 nav에 "서비스" → `/#services` 링크 추가 (홈 다음 위치)
- `src/app/layout.tsx` — 메타데이터(title/description/keywords/OG) 전부 ecosystem 카피로 갱신. 푸터 4컬럼 그리드(Brand/Services/Apply/Contact)로 확장 — services 컬럼은 `services` 배열 직접 매핑.
- `src/app/opengraph-image.tsx` — OG 이미지 카피 갱신: "모든 신청, 한 곳에서" → "통합 비즈니스 자동화 플랫폼" + 9개 브랜드 나열

**보너스: 기존 lint 오류 3건 정리 (Vercel build 견고성 ↑):**
- `src/components/FormRenderer.tsx:133` — `<a href="/">` → `<Link>` 교체 (next/no-html-link-for-pages)
- `public/inapp-guard.js:69` — `var btn = this` 패턴 제거 (no-this-alias)
- `src/app/admin/page.tsx:1145` — useEffect-setState 동기 호출 → derived state pattern으로 전환 (react-hooks/set-state-in-effect)
→ `npm run lint` 0 errors, `npm run build` Pass.

## ✅ Vercel 프로덕션 빌드 — 해결됨 (2026-04-30 확인)

기존 메모에 있던 "빌드 15초 Error" 이슈는 **이미 복구됨**. `vercel ls` 기준 최근 3건 배포 모두 ● Ready (3일 전). 해결된 원인 = .env 따옴표(`feedback_env_quotes.md` 참조) + `8bb86f8` 추적 제거 콤보. 로컬 production build도 클린.

**잔여 흠집 (배포에는 영향 없음):**
- `.vercel/project.json` 의 `projectName`이 여전히 `seminar-app` (실제 Vercel은 `alltica`로 리네임 완료, projectId 바인딩이라 동작 OK). 신경 쓰이면 `vercel link` 다시 돌리면 됨. 안 돌려도 무방.

## 🔔 사용자 결정 대기 항목 (자율진행 불가)

1. **로컬 Hero/Lineup 시각 검토** — 새 카피/색상/카테고리 분류가 의도와 맞는지 사용자가 브라우저로 확인 필요. `npm run dev` → http://localhost:3008/ 진입해서 보는 게 빠름.
2. **이모지 vs 정식 로고** — 현재 카드 아이콘은 이모지(📸▶️✍️❤️📊📇📤💇🏢) 임시 사용. 각 ~tica 별 진짜 로고/심볼이 있으면 교체 필요 (사용자가 자산 제공해야).
3. **카테고리 분류 검토** — Beautica를 "비즈니스 운영"으로, Datica를 단독 "분석"으로 묶음. 컨셉상 다른 분류 원하면 `services.ts` `category` 값만 수정.
4. **Onetica/Novtica 진행 시점** — 둘 다 "준비 중". Onetica는 폴더 존재(미배포), Novtica는 폴더 자체 없음. 언제 어떤 순서로 만들지 사용자 판단.
5. **Phase 2 우선순위 (아래 목록 중 다음 무엇)**

## Phase 2 백로그

- 카카오/네이버 소셜 로그인 실연동 (현재 버튼만 있고 "준비 중" alert)
- 토스페이먼츠 PG 연동 (즉시 카드/간편결제 → 수동 계좌이체 UX 축소)
- 카카오 비즈니스 채널 신청 → 알림톡 템플릿 승인 → SolAPI SMS → 알림톡 전환 (`src/lib/sms.ts` 에 type 분기 추가)
- ~~일반 문의/제품/인재/파트너 폼 Supabase 이관~~ ✅ 2026-05-01 완료 (아래 참조)
- 세미나 데이터 실제 내용으로 교체 (제품교육/B2B영업/디지털광고 3개 플레이스홀더)
- 세미나별 명함 OCR 정확도 A/B 모니터링 (OCR 실패 건 별도 로그)
- 4/24에 만든 강사/관리자 시스템 로컬 E2E 테스트 (`/teacher/seminars/new` 등록→수정→삭제, 신청자 명단, 세미나별 SMS 오버라이드, subadmin 권한 제약)

## 2026-05-01 자율 작업 (로컬, 미배포 — 사용자가 한꺼번에 배포 예정)

**A. 서비스 라인업 admin 게이트:**
- `src/lib/services.ts` 순서 재배열 — 1행: Postica/Beautica/Netica (live), 2~3행: Yutica/Liketica/Datica/Contica/Onetica/Novtica (모두 coming-soon)
- `src/lib/admin-context.ts` 신규 — 서버 컴포넌트용 admin 판별 (`admin_session` 쿠키 OR NextAuth role∈{admin, subadmin})
- `src/components/ServiceLineup.tsx` async 전환, `effectiveLive = status==="live" && isAdmin`. 일반 유저는 9개 모두 "준비 중", 관리자만 1행 3개 링크 활성
- `src/app/layout.tsx` 푸터 SERVICES 컬럼 동일 게이트

**B. 일반 문의 폼 Supabase 이관 (Vercel prod 영속화 버그 수정):**
- 신규 `public.submissions` 테이블 + `submission-files` Storage 버킷 (schema.sql)
- `src/app/api/submissions/route.ts` 전면 재작성 — POST는 Storage 업로드 + jsonb 인서트, GET은 서명 URL 발급(1시간 TTL)해서 Submission[] (camelCase) 반환. 기존 admin/FormRenderer 응답 시그니처 그대로 유지
- `src/lib/storage.ts` 삭제 (consumer 0개 확인 후) + `data/submissions.json` 삭제
- `src/lib/supabase.ts` 에 `SUBMISSION_FILES_BUCKET` 상수 추가

**C. 어드민 일반문의 탭 엑셀 다운로드 추가:**
- `src/app/admin/page.tsx` 에 `exportSubmissionsExcel` + `submissionsToSheet` 함수 — 전체 시트 + formSlug 별 시트. 알려진 키(name/phone/email/company/position) 외 추가 응답은 "기타" 컬럼으로 합쳐 출력
- 파일명: `alltica-일반문의-YYYY-MM-DD.xlsx`

**검증 상태:**
- `npx tsc --noEmit` 0 에러 / `npm run lint` 0 에러 / `npm run build` 52 페이지 모두 컴파일 통과
- 브라우저 시각 검증은 사용자 몫 (아래 "이어서 할 일" 1번)
- **배포 안 함, 커밋 안 함** — 사용자가 `/test` 또는 `/bye` 호출 시점에 일괄 처리 예정

## 🚨 배포 전 사용자가 직접 해야 하는 일 (자율 불가)

1. **Supabase SQL Editor 에서 `supabase/schema.sql` 재실행** — `submissions` 테이블과 `submission-files` 버킷이 prod Supabase 에 생기지 않으면 일반 문의 폼이 500으로 깨짐. CREATE IF NOT EXISTS / on conflict do nothing 이라 재실행 안전.
2. 로컬 dev 시각 검증 4종 (위 A·B·C 가시 효과 확인)

## 다음 세션에 이어서 할 일 (Next up when resuming)

1. **사용자 시각 검증 — 다음 PC에서 우선:**
   - `npm run dev` → http://localhost:3008/ 진입, 9개 카드 일반 유저(시크릿 창)에 모두 "준비 중" / `/admin/login` 후 새로고침 시 1행 3개만 활성
   - `/admin` 헤더 겹침 사라졌는지
   - 일반 회원 계정으로 우상단에 `마이페이지`만 뜨고 `관리자`는 안 뜨는지, `/mypage` 잘 열리는지
   - 명함 OCR 시 주소가 있으면 채워지는지, 없을 때 빈칸으로 남는지(`<UNKNOWN>` 안 뜨는지)
   - `[우편번호 검색]` 버튼 → Daum 팝업 → 선택 시 우편번호+기본주소 자동 채움 확인
   - 일반 문의 폼 제출 → `/admin` 📝 일반 문의 탭에서 보이는지 + 엑셀 다운로드 동작

2. **OCR 주소 추출 정확도 — 실제 명함 샘플 검증:**
   - 강화된 프롬프트로도 주소 누락이 빈번하면 모델을 Sonnet으로 잠시 올려서 비교하거나 prompt 추가 보강 필요
   - 사용자가 실패 케이스 명함 이미지를 보여주면 prompt 튜닝

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
