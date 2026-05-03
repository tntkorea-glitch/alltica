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
- 결제: 수동 계좌이체 (`BANK_*` env)
- 도메인: alltica.co.kr (호스팅케이알 DNS) + alltica.vercel.app
- 자동화: Stop 훅 auto-commit (push 안 함) + gitleaks pre-commit + SessionStart git pull

## 배포 상태

**2026-05-03 배포 완료** — alltica.co.kr
커밋: `496f7af` (이미지 업로드 기능)

## 이번 세션 완료 작업 (2026-05-02~03)

- postica 5/6(수), 5/7(목) 오전/오후 4개 신규 세션 추가
- KBA 서태리 이사장 문화센터 강좌 5개 생성 (슈가링왁싱/LED속눈썹연장/아로마/속눈썹펌/이온화에너지케어)
- 세미나 복제 기능 (어드민 → `/teacher/seminars/new?from=ID`)
- 캘린더 뷰 추가 (`/seminars` — 목록/캘린더 토글, 월별 이동)
- 이미지 지원: `image_url` DB 컬럼, 세미나 상세 이미지 표시
- **이미지 직접 업로드**: `seminar-images` Storage 버킷, `/api/teacher/seminars/upload-image`, TeacherSeminarForm 드래그&드롭 UI
- 더미 강좌 3개 삭제 (제품교육/B2B영업/디지털광고)
- KBA 강좌: 가격 3만원 통일, "총 4강" 제거, 1회차 OT 커리큘럼으로 교체
- A~C 미배포 항목 (서비스 라인업 admin 게이트, Supabase 일반문의 이관, 엑셀 다운로드) 포함 일괄 배포

## Phase 2 남은 백로그

- 카카오/네이버 소셜 로그인 실연동 (현재 "준비 중" alert)
- 토스페이먼츠 PG 연동 (수동 계좌이체 → 즉시 결제)
- ~~카카오 알림톡 전환~~ **코드 완료, 비즈니스 심사 대기 중**
- 강사/관리자 시스템 로컬 E2E 테스트
- OCR 주소 정확도 실제 명함 검증

## 사용자 결정 대기

- 9개 서비스 카드 정식 로고 자산
- KBA 강좌 2회차~ 일정 확정 후 복제 기능으로 추가
- Phase 2 다음 우선순위

## 🔔 알림톡 활성화 절차 (비즈니스 심사 완료 후)

1. **Supabase SQL**: `ALTER TABLE users ADD COLUMN IF NOT EXISTS solapi_pf_id text;`
2. **`.env.local`** 값 채우기: `SOLAPI_PF_ID`, `SOLAPI_ALIMTALK_TEMPLATE_APPLICANT`, `SOLAPI_ALIMTALK_TEMPLATE_ADMIN`
3. 솔라피 알림톡 템플릿 2개 등록

## Supabase 적용 SQL (이미 실행 완료)

```sql
ALTER TABLE public.seminars ADD COLUMN IF NOT EXISTS image_url text;
-- KBA 이미지 URL UPDATE (5개)
INSERT INTO storage.buckets (id, name, public) VALUES ('seminar-images', 'seminar-images', true) ON CONFLICT (id) DO NOTHING;
CREATE POLICY "Public read seminar images" ON storage.objects FOR SELECT USING (bucket_id = 'seminar-images');
```
