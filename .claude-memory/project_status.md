---
name: 프로젝트 상태
description: alltica 현재 진행 상태 및 다음 작업
type: project
originSessionId: 748b6203-c04d-455a-8603-299ed4a2a4cb
---
## 현재 상태 (2026-04-21)
통합 신청센터 사이트 구축 완료 + 배포 완료.
프로젝트 리네임: seminar-app → alltica (2026-04-21). 폴더 `D:\dev\alltica`로 이동 완료.

**완성된 기능:**
- 풀스크린 히어로 랜딩 페이지 (Class101/MoneyUpClass/윤자동 벤치마킹 디자인)
- 5개 신청서 폼: 세미나/교육, 제품 구매, 인력 모집, 파트너 신청, 일반 문의
- 동적 폼 렌더러 (text, tel, email, textarea, select, checkbox, date, number, file 지원)
- 파일 업로드 (public/uploads/)
- 관리자 대시보드 (/admin)
- 관리자 인증: 환경변수(ADMIN_PASSWORD) 기반, 서버 API(/api/auth)로 검증
- API 보안: Authorization 헤더(Bearer) 방식으로 submissions 조회
- 파일 기반 JSON 스토리지 (data/submissions.json)
- 스크롤 반응 헤더, 카카오톡 플로팅 버튼
- 자동 커밋/푸시 훅 + gitleaks pre-commit hook
- Vercel 배포 완료 (도메인: alltica.vercel.app)

**Why:** 기존 Tally/네이버폼 8개+ 분산된 신청서를 하나로 통합하기 위함.

## 리네임 완료 (2026-04-21)
- GitHub repo: `seminar-app` → `alltica` ✅
- 로컬 remote URL: `https://github.com/tntkorea-glitch/alltica.git` ✅
- Vercel 프로젝트명 + 도메인: `alltica.vercel.app` ✅

## 주의: 2026-04-21 원격 전체 삭제 사고
다른 PC에서 폴더 리네임 중 원본 폴더 비워진 채로 auto-commit이 발동,
전체 파일 삭제 커밋(`8d4b337`)이 원격에 push됨. 이 PC에서 force-push로 복구(`845ba70`).
**교훈:** 폴더 리네임/이동 시 auto-commit 훅이 빈 디렉토리를 푸시하지 않도록 주의.

## Next up (alltica 리네임 완료, 코드 유지하고 새 기능 추가 방향)
사용자가 어떤 새 기능을 추가할지 결정 중. 후보:
- DB 연동 (현재 파일 기반 JSON → Postgres/Supabase)
- 신청서 커스터마이징 / 새 폼 추가
- 커스텀 도메인 연결
- 이메일 알림 (신청 들어오면 관리자에게 메일)
