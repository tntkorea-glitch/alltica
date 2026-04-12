---
name: 프로젝트 상태
description: seminar-app 현재 진행 상태 및 다음 작업
type: project
originSessionId: 24ff252c-e2a9-44f9-8812-7ab1254b052e
---
## 현재 상태 (2026-04-12)
통합 신청센터 사이트 초기 구축 완료.

**완성된 기능:**
- 풀스크린 히어로 랜딩 페이지 (Class101/MoneyUpClass/윤자동 벤치마킹 디자인)
- 5개 신청서 폼: 세미나/교육, 제품 구매, 인력 모집, 파트너 신청, 일반 문의
- 동적 폼 렌더러 (text, tel, email, textarea, select, checkbox, date, number, file 지원)
- 파일 업로드 (public/uploads/)
- 관리자 대시보드 (/admin, 비밀번호: admin1234)
- 파일 기반 JSON 스토리지 (data/submissions.json)
- 스크롤 반응 헤더, 카카오톡 플로팅 버튼
- 자동 커밋/푸시 훅 + gitleaks pre-commit hook

**Why:** 기존 Tally/네이버폼 8개+ 분산된 신청서를 하나로 통합하기 위함.

**How to apply:** 이 프로젝트는 아직 Vercel에 link되지 않음. 첫 배포 시 `vercel link` 필요.

## Next up when resuming
- Vercel 프로젝트 연결 및 첫 배포 확인
- 실제 데이터 제출 테스트
- DB 연동 고려 (Supabase 등 - 현재 파일 기반)
- 관리자 비밀번호 환경변수로 이동
- 신청서 항목 실제 비즈니스에 맞게 커스터마이징
