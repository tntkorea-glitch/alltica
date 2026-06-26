---
name: 프로젝트 상태
description: alltica 현재 진행 상태 — 환경 요약, 미배포 작업, 배포 전 체크리스트, Phase 2 백로그
type: project
originSessionId: cc8b50ae-ba95-4216-8623-7836d9e50551
---
> 완성된 기능/완료된 작업 상세는 코드와 `git log`에 있음. 이 문서는 **현재 미완료/미배포/대기 항목만** 추적.

## 핵심 환경 (참조)

- Next.js 16 (`proxy.ts`, middleware.ts 아님) + React 19 + Tailwind v4 + TypeScript
- Supabase ref `ytemhdubbjrinpbdbgri` (신 프로젝트, 2026-05-15 이관) — 테이블: `applications`/`users`/`seminars`/`submissions`/`app_settings`. Storage: `business-cards`/`submission-files`/`seminar-images`
- 인증: NextAuth v5 (Google만 활성, 카카오/네이버 placeholder) + admin_session HMAC 쿠키
- OCR: Claude Haiku 4.5 Vision tool_use
- SMS: SolAPI 단문 90B (postica와 크레덴셜 공유)
- 결제: 토스페이먼츠 PG (`@tosspayments/tosspayments-sdk`) — 카드결제. TOSSPAYMENTS_SECRET_KEY / NEXT_PUBLIC_TOSSPAYMENTS_CLIENT_KEY 환경변수 필요
- 도메인: alltica.co.kr (호스팅케이알 DNS) + alltica-gamma.vercel.app
- Vercel 계정: a01092935659-s-projects (신 계정, 2026-05-15 이관)
- 자동화: Stop 훅 auto-commit (push 안 함) + gitleaks pre-commit + SessionStart git pull

## 배포 상태

**2026-05-18 배포** — 성능 최적화 + Supabase URL 오타 수정 배포  
alltica.co.kr (신 Vercel a01092935659, Supabase ytemhdubbjrinpbdbgri)

## 이번 세션 완료 작업 (2026-05-09 2차)

- **세미나 자동 일정종료 처리**: `mapRow()`에서 `end_at`/`start_at` 기준으로 지난 세미나 자동 `completed` 처리
- **세미나 목록 개선**: "모집중" 탭 날짜 오름차순 정렬, 하단 섹션 "지난 세미나" → "일정종료 N개"로 변경, 배지 "종료"→"일정종료"
- **세미나 날짜 일괄 이동**: 전체 +7일 스크립트, postica만 +10일, 5/14~17 → 5/25~28 (+11일) 스크립트 작성·실행
- **대회 신청 페이지 신설**: `/contests` 페이지 + `src/lib/contests.ts` 샘플 데이터 4개, 네비게이션 추가
- **메인 페이지**: Hero에 "🏆 대회 신청" CTA 버튼 추가, 세미나 섹션 아래 "진행 중인 대회·공모전" 프리뷰 섹션 추가

## 추가 완료 (2026-05-09 3차)

- **admin 탭 확장**: "신청 관리" → "세미나 신청" + "대회 신청" 분리, "세미나 관리" 옆 "대회 관리" 탭 추가
- **ContestMgmtTab**: lib/contests.ts 정적 데이터 테이블로 표시
- **ContestsApplyTab**: 대회 신청자 관리 UI 뼈대 (신청 폼 연동 후 활성화)
- **Solapi 설정 매뉴얼**: `/docs/solapi-setup` 6단계 가이드 페이지 생성
- **SolapiModal 링크**: 모달 우상단 "📖 설정 매뉴얼" 버튼 추가

## 추가 완료 (2026-05-09 4차)

- **빌드 에러 수정**: `src/app/docs/solapi-setup/page.tsx`에서 `React.ReactNode` → `ReactNode` import 추가 (Vercel ❌ 해결)
- **배포**: `b3cbef8` push → Vercel 자동빌드 트리거

## 추가 완료 (2026-05-09 5차)

- **vercel.json BOM 제거**: UTF-8 BOM(`\xef\xbb\xbf`) 으로 인한 Redeploy 파싱 에러 수정 (`7f96958`)
- **Solapi 알림톡 환경변수 확인**: tnt-mall 코드(`lib/alimtalk-shipping.ts`) 분석하여 alltica에 필요한 변수 목록 정리
  - 공통: `SOLAPI_API_KEY`, `SOLAPI_API_SECRET`, `SOLAPI_SENDER`, `SOLAPI_PF_ID`(KA01PF26050906364994371YqrVj4doS), `SOLAPI_ALIMTALK_TEMPLATE_SIGNUP`(6fbJkroW1P)
  - alltica 전용: `SOLAPI_ALIMTALK_TEMPLATE_PREPARING`, `SOLAPI_ALIMTALK_TEMPLATE_SHIPPING`, `BANK_SMS_WEBHOOK_TOKEN` (템플릿 미생성 상태)

## 추가 완료 (2026-05-10)

- **대회 신청 폼 3종 구현**: `/contests/[id]/apply` — 선수/심사위원/조직위 탭 폼 (선택 부문 체크박스, 유효성 검사, /api/submissions 저장)
- **완료 페이지**: `/contests/[id]/apply/complete?type={athlete|judge|committee}`
- **contests.ts applyUrl 실링크 연결**: 모집중 2개, 예정 2개 모두 `/contests/{id}/apply`
- **submissions API prefix 쿼리**: `?formSlugPrefix=contest-` → Supabase `.like()` 필터
- **admin 대회 신청 탭 실데이터 연동**: 유형별 집계, 필터, 목록 테이블, 상세 모달

## 추가 완료 (2026-05-11)

- **회원 등급 시스템 (2컬럼 분리)**: `role`(시스템권한) + `kba_grade`(KBA등급) 완전 독립 — `src/lib/roles.ts` 신규
- **대회 신청 로그인 게이트**: 미로그인 시 Google 로그인 유도 화면 표시
- **조직위 신청 KBA 등급 제한**: `kbaGrade` 존재 여부로 판단, 없으면 팝업 안내 (연락처 포함)
- **서버 사이드 권한 검사**: `/api/submissions` POST에 로그인 + kbaGrade 검사
- **admin 등급 관리 UI**: 시스템권한/KBA등급 드롭다운 분리 + pending 방식 저장 버튼
- **JWT 항상 fresh**: 매 요청마다 DB에서 role/kbaGrade 조회 → 재로그인 없이 즉시 반영
- **admin 저장 후 세션 강제 갱신**: `updateSession()` 호출

## 추가 완료 (2026-05-18 1차)

- **성능 최적화**: layout.tsx `Promise.all` 병렬화, auth.ts JWT 콜백 DB 재조회 제거 (토큰 캐시), theme.ts `unstable_cache` 60초 캐싱, 홈페이지 `getPreviewSeminars` 한정 쿼리 (전체→3개)
- **Google OAuth 에러**: 구글 클라우드 콘솔 OAuth 클라이언트 재설정 안내 (invalid_client, 계정 이전 후 발생)
- **Supabase URL 오타 수정**: `.env.local` + Vercel env `ytemhdubbrinpbdbgri` → `ytemhdubbjrinpbdbgri` (j 누락 → Bucket not found 에러 원인)

## 추가 완료 (2026-05-18 2차)

- **신규 회원 프로필 완성 게이트**: 처음 Google 로그인 시 이름/연락처/상호 입력 폼 강제 표시 후 메인 이동
- **연락처 자동 하이픈**: 프로필 완성 폼 + 마이페이지 010-XXXX-XXXX 포맷 자동 적용
- **마이페이지 개선**: 회원등급(한글표기), 상호 표시, 신청 대회 내역 섹션 추가
- **어드민 패널**: 회원 삭제 버튼, "KBA등급"→"회원등급", "없음"→"일반회원"
- **헤더 항상 solid**: 홈 외 모든 페이지에서 투명 → 고정 흰색 헤더
- **KBA 등급 JWT 캐시 우회**: 대회 신청 페이지에서 DB 직접 조회 후 prop 전달 (재로그인 불필요)
- **조직위 신청 폼 에러 UX**: `submitted` + `useEffect` 스크롤 패턴으로 에러 배너 표시 (헤더 오프셋 -80px)
- **formSlug 중복 버그 수정**: `contest-contest-ibc-...` → `contest-ibc-...-committee` (contest- 이중 적용 수정)
- **Supabase Storage 한글 파일명 오류 수정**: `safeName` 함수에서 한글 제거, ASCII만 허용
- **어드민 신청자 이름/연락처 표시**: `extractFields` 헬퍼 추가 — `name`/`phone`/`email`(영어키) + `한글이름`/`연락처`/`이메일`(한글키) 모두 지원

## 추가 완료 (2026-06-24)

- **대회 신청 전체 마감 처리**: `src/lib/contests.ts` IBC 12th 상태 `"모집중"` → `"마감"` 변경
- **누락 대회 2개 복구**: 제1회 Alltica 전국 뷰티 기술 경연대회 + 슈가링왁싱 챔피언십 2026 코드에 재추가 (상태: `"마감"`)
- **배포**: ef548ab → Vercel 프로덕션 배포 완료 (2026-06-24)

## 추가 완료 (2026-06-25)

- **IBC 12th 추가모집 오픈**: `status: "마감"` → `"마감임박"`, `applicationDeadline` → `"2026년 6월 26일 (금)까지 · 추가모집"`, subtitle에 추가모집 기간(6/25~6/26) 표기, schedule에 추가모집 접수 항목 추가
- **심사위원 신청 종류 선택 추가**: 심사 가능 종목 선택 후 3종류 선택 (글로벌 200만원 / 수석·일반 150,000원), 수석은 IBC 3회 이상 경력자 한정 안내
- **위촉패 이미지 추가**: `public/contests/judge-trophy.png` (블랙골드·크리스탈 트로피 사진)
- **온라인 심사 안내**: 7/15 대회장 불참석, 온라인 심사 진행, 위촉장·위촉패 발송 안내 박스
- **결제 안내**: 기업은행 010-9293-5659 KBA뷰티스트총연합회, 즉시 입금 시 즉시 확정 안내
- **배포**: 589c276 → Vercel 프로덕션 배포 완료 (2026-06-25), alltica.co.kr 반영

## ⚠️ Next up when resuming (최우선)

1. **Supabase SQL 확인**: `submissions` 테이블에 `user_email` 컬럼 추가 여부 확인:
   ```sql
   ALTER TABLE submissions ADD COLUMN IF NOT EXISTS user_email TEXT;
   ```
2. **조직위 신청 E2E 테스트**: 파일 업로드(한글파일명), 폼 제출, 어드민 패널 이름/연락처 표시 모두 확인
3. **추가모집 마감 후 처리**: 6/27 이후 IBC 12th 상태 다시 `"마감"` 으로 되돌리기

## Phase 2 남은 백로그

- **토스 key 등록** — `.env.local`에 `NEXT_PUBLIC_TOSSPAYMENTS_CLIENT_KEY`, `TOSSPAYMENTS_SECRET_KEY` 추가 필요 (Vercel 환경변수도)
- **대회 신청 실데이터** 교체 — `src/lib/contests.ts` CONTESTS 배열 수정
- 카카오/네이버 소셜 로그인 실연동 (현재 "준비 중" alert)
- ~~카카오 알림톡 전환~~ **코드 완료, 비즈니스 심사 대기 중**
- 강사/관리자 시스템 로컬 E2E 테스트
- OCR 주소 정확도 실제 명함 검증

## 사용자 결정 대기

- **토스페이먼츠 API 키** 발급 후 Vercel 환경변수 등록
- 9개 서비스 카드 정식 로고 자산
- **대회 실제 정보** 확정 후 `src/lib/contests.ts` 수정

## 🔔 토스 결제 활성화 절차 (키 발급 후)

1. `.env.local` 추가:
   ```
   NEXT_PUBLIC_TOSSPAYMENTS_CLIENT_KEY=test_ck_...
   TOSSPAYMENTS_SECRET_KEY=test_sk_...
   ```
2. Vercel 대시보드 → Settings → Environment Variables 동일하게 추가
3. Redeploy

## 🔔 알림톡 활성화 절차 (비즈니스 심사 완료 후)

1. **Supabase SQL**: `ALTER TABLE users ADD COLUMN IF NOT EXISTS solapi_pf_id text;`
2. **`.env.local`** 값 채우기: `SOLAPI_PF_ID`, `SOLAPI_ALIMTALK_TEMPLATE_APPLICANT`, `SOLAPI_ALIMTALK_TEMPLATE_ADMIN`
3. 솔라피 알림톡 템플릿 2개 등록

## Supabase 적용 SQL (이미 실행 완료)

```sql
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS image_url text;
ALTER TABLE applications ADD COLUMN IF NOT EXISTS toss_payment_key text;
INSERT INTO storage.buckets (id, name, public) VALUES ('seminar-images', 'seminar-images', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Public read seminar images" ON storage.objects FOR SELECT USING (bucket_id = 'seminar-images');
```
