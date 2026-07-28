---
name: judge-system
description: /judge IBC 미용대회 온라인 심사 시스템 — 구현 현황 및 다음 작업
metadata: 
  node_type: memory
  type: project
  originSessionId: 7aa17396-7a5e-45f6-b4fc-c5dfba97fc36
---

## 위치 및 진입점

- 관리자 페이지: `/judge/admin` (`src/app/judge/admin/page.tsx`)
- API 라우트: `src/app/api/judge/` 폴더
- dev 서버: localhost:3008

## DB 테이블 (Supabase)

- `competitions` — id, title, description, date_display, status, allow_contestant_upload, contest_slug
- `categories` — id, competition_id, name, display_order
- `contestants` — id, category_id, name, phone, email, company, grade, number, display_order, **manual_award** (text, nullable)
- `contestant_files` — id, contestant_id, storage_path, file_name, file_type, video_url
- `judge_assignments` — id, user_id, category_id, assigned_by, title
- `competition_award_settings` — id, competition_id, grade, award_name, count, percent, per_major_category, min_group_size, display_order

## 구현 완료

### 대회·종목 탭
- 대회 목록 + 신청서에서 자동 생성 (contest_slug 연동)
- 종목 추가 (직접입력 / 신청서에서 자동 추가)

### 선수·파일 탭
- 대회 선택 시 전체 선수 자동 로드 (category 선택 불필요)
- 종목별 그룹 테이블 형태
- 참가번호 자동 부여 (종목별 1부터, number 컬럼)
- 신청서에서 불러오기: division → category 매핑, 2종목 이상 선수 각 종목에 중복 등록

### 심사위원 배정 탭
- 신청서에서 불러오기 → 테이블 형태
- 배정완료 심사위원 목록 → 테이블 형태
- 조직위(-committee) 신청자 포함
- 전화번호 매칭으로 실 Google 계정 연결

### 심사 화면 + 채점항목
- `/judge/score` — 5단계 버튼 UX (scale 값 표시)
- 채점항목 자동 설정 (IBC 기준표 전종목)

### 시상 화면 (`/judge/awards`) — 2026-07-17 완성
- 탭: 전체 / 프로전문가부 / 학생부 / 종목별 / 단체별 / 특별상
- **sticky 탭바**: top-16에 고정
- **종목별 집계표**: 프로/학생 통합 테이블, 상별 트로피 수(합계+프로+학생) 헤더 표시
- **단체별 rowspan 테이블**: 이름/부문 셀 병합, 열 구분선
- **단체별 점수 ON/OFF 토글**: 오른쪽 상단 버튼으로 점수 열 표시/숨김
- **상명 직접 수정**: AwardRow 인라인 편집 → PATCH API → 모든 탭 자동 반영
- **min_group_size**: 월드MVP챔피언 등 per_major_category 시상에서 최소 인원 조건 설정 가능
- **manual_award**: contestants 테이블 컬럼 추가 완료. 이 값이 있으면 computed award를 덮어씀
- **2종목 중복상 방지**: `deduplicateMultiCategoryAwards` — 같은 사람이 같은 상 2개 이상이면 하위 상으로 조정

### 미집계 해결 (2026-07-17)
- **근본 원인**: Supabase PostgREST 서버사이드 1000row 제한. batch=50 → 1,257 rows/batch → 절단
- **수정**: `SCORE_BATCH = 15` (375 rows/batch, 1000 안전)
- **파일**: `src/app/api/judge/competition-results/route.ts`
- 결과: 25명 "미집계"가 모두 정상 집계됨 (점수 자체는 정상 존재)

## 2026-07-17 추가 완료

### 시상 화면 완성 기능
- **단체별 시상 배지 인라인 수정**: 배지 클릭 → select 드롭다운 → manual_award DB저장 → 전체 탭 재로드. 노란 점(●)으로 수동/자동 구분
- **단체별 점수 ON/OFF 토글**: 탭 우측 상단 버튼으로 점수 열 표시/숨김
- **인쇄/PDF 출력 페이지** (`/judge/awards/print`):
  - 탭바 우측 `🖨️ 인쇄/PDF` → 새 탭으로 출력 페이지 열림
  - 출력 형식 3종: 단체별 / 시상별 / 전체목록
  - 단체별 탭 각 단체마다 `🖨️ 단체 출력` 버튼 → `?company=단체명` 파라미터로 해당 단체만 인쇄
  - A4 세로 `@media print` CSS 최적화

## 남은 작업 (다음 세션 우선순위)

1. **월드MVP챔피언 min_group_size**: 시상설정 패널에서 월드MVP챔피언 → "최소 N명↑만" 필드에 숫자 입력 (UI는 있음, 실제 설정값 입력 필요)
2. **인쇄 페이지 개선**: 특별상(최우수/우수선수상) 별도 섹션 추가 여부 검토

## 주의사항

- `xlsx` 패키지: 반드시 `import * as XLSX from "xlsx"` (static top-level)
- `data-file/` 폴더: `D:\dev\alltica\data-file\`
- judge_assignments upsert onConflict: `"user_id,category_id"`
- Supabase 1000row 제한: score 배치 조회는 반드시 batch=15 이하로 유지
- .env.local 값에 따옴표 있으면 Node.js 스크립트에서 `replace(/^['"]|['"]$/g,'')` 처리 필요

**Why:** IBC 12th 2026-07-15 대회 준비용. 온라인 심사 시스템 신규 구축 중.
**How to apply:** judge 관련 작업 시 이 문서 먼저 확인.
