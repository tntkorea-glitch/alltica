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
- Vercel 배포 완료 (현재 도메인: seminar-app-mauve.vercel.app — 리네임 예정)

**Why:** 기존 Tally/네이버폼 8개+ 분산된 신청서를 하나로 통합하기 위함.

## Next up when resuming (alltica 폴더에서 새 세션 시작 후)
1. **GitHub repo 이름 변경**: `seminar-app` → `alltica` (Settings → Rename)
2. **로컬 remote URL 갱신**: `git remote set-url origin https://github.com/tntkorea-glitch/alltica.git`
3. **Vercel 프로젝트 이름 변경**: dashboard에서 `seminar-app` → `alltica` (Settings → General → Project Name)
4. 위 완료 후 이어서 작업: DB 연동, 신청서 커스터마이징, 커스텀 도메인, 이메일 알림
