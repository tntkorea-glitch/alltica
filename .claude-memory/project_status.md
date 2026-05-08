---
name: 프로젝트 상태
description: alltica 현재 진행 상태 — 환경 요약, 미배포 작업, 배포 전 체크리스트, Phase 2 백로그
type: project
originSessionId: 748b6203-c04d-455a-8603-299ed4a2a4cb
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

**2026-05-06 배포 완료** — alltica.co.kr  
커밋: `10b5916` (Hero 텍스트 Maketica/Infotica 11개 반영)

## 이번 세션 완료 작업 (2026-05-06)

- **토스페이먼츠 PG 연동** 전체 구현:
  - `TossPaymentWidget.tsx` — 카드 결제 버튼 (loadTossPayments + ANONYMOUS)
  - `PaymentSuccessClient.tsx` — 결제 확인 스피너 → 완료 리다이렉트
  - `/apply/payment/page.tsx` — 결제 페이지 (DB에서 금액 확인)
  - `/apply/payment/success/page.tsx` — 토스 콜백 처리
  - `/apply/payment/fail/page.tsx` — 실패 페이지 + 재시도
  - `/api/payments/confirm/route.ts` — 금액 검증 + 토스 승인 + DB 업데이트
  - `SeminarApplyForm.tsx` — price > 0이면 결제 페이지로 분기
  - `complete/page.tsx` — `?paid=1` 결제완료 / 무료 / 계좌이체 3분기 처리
  - Supabase `applications` 테이블에 `toss_payment_key` 컬럼 추가 (사용자 실행 완료)
- **Hero 첫 화면 서비스 업데이트**: 9개→11개, Maketica/Infotica 텍스트 반영
- `layout.tsx` 메타데이터/OG/Twitter 설명 11개로 업데이트, keywords에 Infotica·Maketica 추가

## Phase 2 남은 백로그

- **토스 key 등록** — `.env.local`에 `NEXT_PUBLIC_TOSSPAYMENTS_CLIENT_KEY`, `TOSSPAYMENTS_SECRET_KEY` 추가 필요 (Vercel 환경변수도)
- 카카오/네이버 소셜 로그인 실연동 (현재 "준비 중" alert)
- ~~카카오 알림톡 전환~~ **코드 완료, 비즈니스 심사 대기 중**
- 강사/관리자 시스템 로컬 E2E 테스트
- OCR 주소 정확도 실제 명함 검증

## 사용자 결정 대기

- **토스페이먼츠 API 키** 발급 후 Vercel 환경변수 등록 (test_ck_ / test_sk_)
- 9개 서비스 카드 정식 로고 자산
- KBA 강좌 2회차~ 일정 확정 후 복제 기능으로 추가

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
