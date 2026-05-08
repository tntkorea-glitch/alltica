---
name: 프로젝트 상태
description: alltica 현재 진행 상태 — 환경 요약, 미배포 작업, 배포 전 체크리스트, Phase 2 백로그
type: project
originSessionId: cc8b50ae-ba95-4216-8623-7836d9e50551
---
> 완성된 기능/완료된 작업 상세는 코드와 `git log`에 있음. 이 문서는 **현재 미완료/미배포/대기 항목만** 추적.

## 핵심 환경 (참조)

- Next.js 16 (`proxy.ts`, middleware.ts 아님) + React 19 + Tailwind v4 + TypeScript
- Supabase ref `omzkzxrncypfluxfwrpg` — 테이블: `applications`/`users`/`seminars`/`submissions`/`app_settings`. Storage: `business-cards`/`submission-files`/`seminar-images`
- 인증: NextAuth v5 (Google만 활성, 카카오/네이버 placeholder) + admin_session HMAC 쿠키
- OCR: Claude Haiku 4.5 Vision tool_use
- SMS: SolAPI 단문 90B (postica와 크레덴셜 공유)
- 결제: 토스페이먼츠 PG (`@tosspayments/tosspayments-sdk`) — 카드결제. TOSSPAYMENTS_SECRET_KEY / NEXT_PUBLIC_TOSSPAYMENTS_CLIENT_KEY 환경변수 필요
- 도메인: alltica.co.kr (호스팅케이알 DNS) + alltica.vercel.app
- 자동화: Stop 훅 auto-commit (push 안 함) + gitleaks pre-commit + SessionStart git pull

## 배포 상태

**2026-05-09 배포** — push `24619fd` → Vercel 자동빌드 트리거됨  
alltica.co.kr

## 이번 세션 완료 작업 (2026-05-09)

- **세미나 자동 일정종료 처리**: `mapRow()`에서 `end_at`/`start_at` 기준으로 지난 세미나 자동 `completed` 처리
- **세미나 목록 개선**: "모집중" 탭 날짜 오름차순 정렬, 하단 섹션 "지난 세미나" → "일정종료 N개"로 변경, 배지 "종료"→"일정종료"
- **세미나 날짜 일괄 이동**: 전체 +7일 스크립트, postica만 +10일, 5/14~17 → 5/25~28 (+11일) 스크립트 작성·실행
- **대회 신청 페이지 신설**: `/contests` 페이지 + `src/lib/contests.ts` 샘플 데이터 4개, 네비게이션 추가
- **메인 페이지**: Hero에 "🏆 대회 신청" CTA 버튼 추가, 세미나 섹션 아래 "진행 중인 대회·공모전" 프리뷰 섹션 추가

## Phase 2 남은 백로그

- **토스 key 등록** — `.env.local`에 `NEXT_PUBLIC_TOSSPAYMENTS_CLIENT_KEY`, `TOSSPAYMENTS_SECRET_KEY` 추가 필요 (Vercel 환경변수도)
- **대회 신청 실데이터** 교체 — `src/lib/contests.ts` CONTESTS 배열 수정
- **대회 신청 폼** — `/contests/[id]/apply` 실제 신청 폼 구현 (현재 applyUrl="#" placeholder)
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
