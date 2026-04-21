const cfg = require("C:/Users/미르/.claude/hub-config.json");

const body = {
  project_slug: "alltica",
  project_name: "alltica",
  project_description: "통합 신청센터 + 세미나 신청 시스템 (명함 OCR · SMS 알림 · 관리자 엑셀 다운로드 · 테마 전환)",
  status: "active",
  progress_percent: 72,
  today_work:
`- 도메인 alltica.co.kr 연결 (호스팅케이알 DNS, Vercel A 레코드 216.150.1.1)
- 세미나 신청 시스템 Phase 1 MVP 전체 구축: /seminars 목록·상세·신청(명함 OCR)·접수완료(계좌안내) + Supabase applications 테이블 + 명함 Storage
- postica 인스타 자동화 세미나 7세션 데이터 + 기존 세미나 리네임/오픈상태/장소 수정 (대구 두산동 교육장)
- SolAPI SMS 단문 90B 강제 포맷(byteLength/truncateToBytes) 적용, 신청자·관리자 메시지 템플릿 설계
- 관리자 페이지 탭 구조(세미나/일반/⚙설정) 재설계 + 세미나별 통계 + xlsx 엑셀 다운로드 + 명함 서명 URL
- Tailwind v4 @theme + data-theme 으로 6가지 스킨(네이비/피치블룸/민트/라벤더/선셋/오션) + 런타임 전환 시스템, app_settings 테이블로 전역 저장
- 연락처 자동 하이픈 포매터, 브랜딩 "통합 신청센터→Alltica" / "알티카→Alltica" / "인력→인재" 통일
- OG 이미지(opengraph-image.tsx, 1200x630) + metadata 설정으로 카톡 링크 미리보기 대응
- VS Code .env 들여쓰기 사고 진단+복구, 원격 전체 삭제 사고 force-push 복구(845ba70)`,
  remaining_work:
`- 프로덕션(alltica.co.kr) 에서 엔드투엔드 테스트 (명함 업로드→OCR→저장→SMS 수신)
- 카톡 링크 미리보기: 카카오 디버거에서 URL 캐시 초기화
- Phase 2: 토스페이먼츠 PG 연동 (즉시 카드/간편결제)
- Phase 2: 카카오 비즈니스 채널 + 알림톡 템플릿 승인 → SMS→알림톡 전환
- Phase 2: 세미나 관리자 CRUD (하드코딩 src/lib/seminars.ts → Supabase seminars 테이블)
- Phase 2: NextAuth v5 일반 사용자 로그인 (현재 관리자 비밀번호 쿠키만)
- 기존 /api/submissions 파일 기반 저장 → Supabase 이관 (Vercel 서버리스에서 현재 동작 안 함)
- 세미나 플레이스홀더 3개(제품교육/B2B영업/디지털광고) 실제 내용으로 교체`,
  next_work:
`1. 프로덕션에서 세미나 신청 엔드투엔드 검증(alltica.co.kr + 실제 명함 + 본인 번호로 SMS 수신)
2. 관리자 /admin 설정 탭에서 스킨 선택 UX 확인 (피치 블룸 추천)
3. 카카오 디버거(developers.kakao.com/tool/debugger/sharing)로 OG 캐시 초기화`,
  raw_markdown:
`# alltica 세션 종료 보고 (2026-04-21)

## 오늘 한 작업
- 도메인 alltica.co.kr 연결 + Vercel 프로젝트 리네임
- 세미나 신청 Phase 1 MVP 구축 (명함 OCR + Supabase 저장 + SolAPI SMS)
- 관리자 페이지 재설계 (3탭: 세미나/일반/설정, 엑셀 다운로드, 스킨 선택)
- 6가지 테마 시스템 (Tailwind v4 @theme + data-theme 런타임 전환)
- OG 이미지 및 카톡 링크 미리보기 대응
- 연락처 자동 하이픈, 브랜딩 통일 (Alltica), "인력→인재"

## 진행률 판단
Phase 1 MVP 완료, 프로덕션 검증 미수행, Phase 2 미착수 → 72%.

## 다음 세션
프로덕션 엔드투엔드 검증부터 시작. 문제 없으면 Phase 2 (PG 연동) 착수.`,
};

fetch(cfg.hub_url + "/api/reports", {
  method: "POST",
  headers: {
    "x-report-secret": cfg.ingest_secret,
    "content-type": "application/json",
  },
  body: JSON.stringify(body),
})
  .then((r) => r.json())
  .then((j) => console.log("hub:", JSON.stringify(j)))
  .catch((e) => console.error("hub error:", e.message));
