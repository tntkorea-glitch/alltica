---
name: 알티카 서비스 라인업 (확정 2026-04-29)
description: 알티카가 통합하는 9개 자매 서비스 + 알티카 본체 = 총 10개 ~tica 브랜드. 도메인/Vercel URL/카테고리 매핑.
type: project
originSessionId: 92f80b41-22c6-4efe-8abc-45ded2c6f253
---
알티카 = 9개 ~tica 자매 서비스를 통합하는 허브. 메인페이지 Hero 바로 아래 `ECOSYSTEM` 섹션(`src/components/ServiceLineup.tsx`)에서 9개 카드로 노출.

## 카테고리 4종

- **SNS 자동화** (blue/indigo): Postica, Yutica, Netica, Liketica
- **분석/인사이트** (emerald): Datica
- **메시징/CRM** (amber): Contica, Onetica
- **비즈니스 운영** (rose): Beautica, Novtica

## 서비스 매핑

| 브랜드 | 한글 이름 | URL | 상태 | 폴더 |
|---|---|---|---|---|
| **Postica** | 인스타 자동화 | https://postica.co.kr | live | `D:\dev\postica` |
| **Yutica** | 유튜브 자동화 | https://yutica.co.kr | live | `D:\dev\yutica` (Vercel 프로젝트명은 `video-automation`) |
| **Netica** | 블로그 자동화 | https://netica.co.kr | live | `D:\dev\netica` |
| **Liketica** | 인스타 자동 좋아요 | https://liketica.vercel.app | live | `D:\dev\liketica` |
| **Datica** | 데이터 분석 | https://datica.vercel.app | live | `D:\dev\datica` |
| **Contica** | 연락처 동기화 | https://contica.vercel.app | live | `D:\dev\contica` (모바일은 `contica-mobile`) |
| **Onetica** | 원클릭 자동발송 | (배포 전) | 준비 중 | `D:\dev\Onetica` (폴더만, .vercel 없음) |
| **Beautica** | 뷰티샵 예약 | https://beautica.vercel.app | live | `D:\dev\beautica` |
| **Novtica** | 사내 프로그램 | (배포/폴더 모두 없음) | 준비 중 | — |
| **Alltica** | 통합 플랫폼 | https://alltica.co.kr | live (허브 본인) | `D:\dev\alltica` |

## 도메인 정책

- 현재 커스텀 도메인 보유: postica.co.kr, yutica.co.kr, netica.co.kr, alltica.co.kr (4개)
- 나머지 5개(Liketica/Datica/Contica/Beautica + 향후 Onetica)는 우선 `*.vercel.app` 사용 → 도메인 획득되면 ServiceLineup.tsx의 `services` 배열 url 만 갱신
- 카드 클릭 시 `target="_blank"` 새창으로 열림 (사용자가 알티카로 돌아오기 쉽게)

## 페이지 구조 (2026-04-29 변경)

`src/app/page.tsx`:
1. Hero (full-screen) — scroll indicator는 `#services` 로 이동
2. **ServiceLineup (`#services`) — NEW** ⭐
3. 세미나 (`#seminars-preview`)
4. 신청서 폼 (`#forms`)
5. 프로세스 / Why Us / CTA

알티카 정체성이 "통합 허브" 임을 메인페이지 진입 즉시 보여주기 위해 라인업을 세미나/신청서보다 위에 배치.
