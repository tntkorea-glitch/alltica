---
name: 프로젝트 상태
description: seminar-app 현재 진행 상태 및 다음 작업
type: project
originSessionId: 748b6203-c04d-455a-8603-299ed4a2a4cb
---
## 현재 상태 (2026-04-13)
통합 신청센터 사이트 구축 완료 + 배포 완료.

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
- Vercel 배포 완료 (seminar-app-mauve.vercel.app)

**Why:** 기존 Tally/네이버폼 8개+ 분산된 신청서를 하나로 통합하기 위함.

## Next up when resuming
- DB 연동 (Supabase 등 - 현재 파일 기반이라 Vercel serverless에서 영속성 이슈 있음)
- 신청서 항목 실제 비즈니스에 맞게 커스터마이징
- 커스텀 도메인 연결
- 이메일 알림 기능 (새 신청서 접수 시)
