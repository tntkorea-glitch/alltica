---
name: 클로드 코드 환경 설정 — 진행 중 (2026-04-30)
description: MCP 서버 추가 및 마켓플레이스 플러그인 설치 워크플로우. 다음 세션에서 재개 시 이 메모부터 확인.
type: project
originSessionId: 92f80b41-22c6-4efe-8abc-45ded2c6f253
---
## ✅ 완료된 작업 (2026-04-30)

**MCP 서버 user scope 설치 + 자동 동기화 셋업:**
- `sequential-thinking` (`@modelcontextprotocol/server-sequential-thinking`) — 다단계 추론 보조
- `context7` (`@upstash/context7-mcp`) — 라이브러리 최신 공식 문서 실시간 조회
- 둘 다 `~/.claude/setup-windows.ps1` 의 `$mcpServers` 배열에 등록 → 다른 PC 에서 setup 재실행하면 자동 설치 (idempotent)
- `tntkorea-glitch/claude-config` 리포 + `tntkorea-glitch/tntkorea-glitch` 프로필 README 동기화 완료

**프로필 README 새 섹션 추가:**
- `https://github.com/tntkorea-glitch` 의 README.md 에 `### 5. MCP 서버 추가/관리` 섹션 작성
- 현재 등록 MCP 표 + 새 MCP 추가 워크플로우 + 트러블슈팅

## 🟡 진행 중 — 다음 세션에서 재개

**Superpowers + Code Simplifier 플러그인 설치 (사용자 막힘):**
- 가이드 흐름: `/plugins` → 마켓플레이스 목록 → `Superpowers` 선택 → 그 안의 플러그인들 install
  - Superpowers (스펙 기반 설계 워크플로우)
  - Code Simplifier (코드 간결화)
  - + Context7 도 이 가이드에서 추천됐는데 그건 MCP 라 이미 별도 설치 완료
- 현재 마켓플레이스: `claude-plugins-official` 1개만. **Superpowers 마켓플레이스가 별도 추가되어야 할 가능성 높음.**
- 사용자가 `/plugins` 메뉴 진입까지는 했고 (`known_marketplaces.json` lastUpdated 갱신됨) 그 다음 단계에서 막힘
- 설치 끝나면 자동으로 해야 할 일:
  1. `~/.claude/plugins/installed_plugins.json` 변경 확인
  2. claude-config 리포에 commit + push (이 파일 git-tracked)
  3. 다른 PC 에선 동기화 한 줄로 자동 적용됨

**다음 세션에서 사용자에게 물어볼 것:**
- Superpowers 마켓플레이스 GitHub repo 이름 (예: `obra/superpowers` 형태)
- 알면 `claude /plugin marketplace add <repo>` 로 추가 → 그 안에서 install
- 막히면 `/plugins` 화면 캡처 받아서 `/pic` 으로 분석

## 📋 부차적 — claude-config 미커밋 변경사항 (정리 필요)

세션 끝 시점 `~/.claude` git status:
```
M commands/bye.md      ← 사용자가 직접 수정?
M commands/save.md
M plugins/known_marketplaces.json  ← timestamp 자동 갱신, 무해
M settings.json
M skills/new/SKILL.md
?? CLAUDE.md
?? skills/md/
```
사용자가 의도해서 수정한 건지, /pic 같은 새 스킬 추가한 건지 다음 세션에서 확인 후 정리.

## 동기화 명령 (참고)

새 PC 또는 기존 PC 에서 최신 상태 받기:
```powershell
$t="$env:USERPROFILE\.claude"; $r="tntkorea-glitch/claude-config"; if (Test-Path "$t\.git") { git -C $t fetch origin; $b=(git -C $t symbolic-ref --short refs/remotes/origin/HEAD) -replace '^origin/',''; git -C $t reset --hard "origin/$b" } elseif (Test-Path $t) { $tmp=Join-Path $env:TEMP ".claude-sync-$(Get-Random)"; gh repo clone $r $tmp; Move-Item "$tmp\.git" "$t\.git"; Remove-Item $tmp -Recurse -Force -ErrorAction SilentlyContinue; git -C $t reset --hard HEAD } else { gh repo clone $r $t }; if (Test-Path "$t\setup-windows.ps1") { powershell -ExecutionPolicy Bypass -File "$t\setup-windows.ps1" }
```
