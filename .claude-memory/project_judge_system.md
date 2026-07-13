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
- `contestants` — id, category_id, name, phone, email, company, grade, number, display_order
- `contestant_files` — id, contestant_id, storage_path, file_name, file_type, video_url
- `judge_assignments` — id, user_id, category_id, assigned_by, title
- `criteria` (채점항목) — 아직 미설정, 탭만 있음
- `awards` (시상설정) — 아직 미설정, 탭만 있음

## 구현 완료

### 대회·종목 탭
- 대회 목록 + 신청서에서 자동 생성 (contest_slug 연동)
- 종목 추가 (직접입력 / 신청서에서 자동 추가)
- `contest_slug` 저장 필수 — competitions POST에 이미 포함

### 선수·파일 탭
- 대회 선택 시 전체 선수 자동 로드 (category 선택 불필요)
- 종목 필터 탭 (상단) — 전체/종목별 토글
- **종목별 그룹 테이블 형태** (2026-07-13 완료):
  - 보라색 헤더로 종목 구분
  - 컬럼: 번호(파란원) | 이름 | 단체명 | 연락처 | 부문 | 파일/첨부 | 삭제
  - 파일/첨부 셀에 +파일 업로드 + ▶YT YouTube 버튼 인라인
- 참가번호 자동 부여 (종목별 1부터, number 컬럼)
- 신청서에서 불러오기: division → category 매핑, 2종목 이상 선수 각 종목에 중복 등록
- 단체접수 파일 (data-file/*.xlsx): IBC 서식 파싱 (row9=헤더, row10+=데이터, col: 0=순번,1=이름,2=상호,5=연락처,8=참가부문,9=대종목,10=세부종목)
- 엑셀 업로드: IBC 서식 자동 감지 or 일반 서식 (이름/연락처 컬럼 자동 탐색)
- 매핑 안 된 종목 → 현재 선택 종목에 fallback 등록 옵션 (체크박스)

### 심사위원 배정 탭
- 신청서에서 불러오기 → 테이블 형태 (2026-07-13 완료):
  - 컬럼: 이름/이메일 | 연락처 | 직책 | 신청종목 | 경력 | 입금확인 | 배정종목 | 배정직책
  - 입금확인 체크 시 해당 행에 배정종목/배정직책 셀렉트 인라인 표시
  - 일괄 배정 버튼 (입금확인된 인원 수 표시)
- 배정완료 심사위원 목록 → 테이블 형태 (2026-07-13 완료):
  - 컬럼: 종목 | 이름 | 이메일 | 직책 | 해제

### API 라우트
- `GET /api/judge/contestants?competition_id=` → 전체 선수 + category_name 조인
- `GET /api/judge/contestants?category_id=` → 종목별 선수
- `POST /api/judge/contestants` → number 자동 부여 후 저장
- `GET /api/judge/import-excel` → data-file/*.xlsx IBC 파싱 반환 (static import * as XLSX 필수!)
- `POST /api/judge/import` action=athletes → 일괄 등록 (fallback_category_id 지원)
- `POST /api/judge/import` action=excel-rows → IBC 행 일괄 등록
- `POST /api/judge/import` action=judges → 심사위원 배정 (email → user_id 매핑)

## 남은 작업 (다음 세션 우선순위)

1. **채점항목(criteria) 설정** — 사용자가 채점 항목 정보 보내줄 예정
2. **시상설정(awards) 설정** — 사용자가 시상 정보 보내줄 예정
3. **실제 심사 화면** `/judge` 경로 — 심사위원이 접속해서 선수별 점수 입력하는 화면
4. **결과 확인** `/judge/admin` → 결과 확인 버튼 연동

## 주의사항

- `xlsx` 패키지: 반드시 `import * as XLSX from "xlsx"` (static top-level) — dynamic import 쓰면 ESM/CJS 이슈로 XLSX.readFile undefined
- `data-file/` 폴더: `D:\dev\alltica\data-file\` — 포항뷰티인.xlsx, 익산뷰티명가.xlsx, 아뜰리에.xlsx
- judge_assignments upsert onConflict: `"user_id,category_id"` (복합 유니크)

**Why:** IBC 12th 2026-07-15 대회 준비용. 온라인 심사 시스템 신규 구축 중.
**How to apply:** judge 관련 작업 시 이 문서 먼저 확인, 위 API 시그니처 그대로 사용.
