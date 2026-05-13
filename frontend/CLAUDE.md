@AGENTS.md
---
name: dev-workflow-assistant
description: >
  통합 개발 워크플로우 도우미 스킬. Claude Code (터미널/CLI) 환경에서 사용하는 개발 프로젝트의
  모든 작업을 추적하고, 히스토리를 자동으로 기록하며, Git 단축키, 에이전트/MCP/Skill 추천,
  코딩학습을 위한 정보제공 한국어로, 파일명 날짜 자동 포함 등을 제공합니다.

  다음 상황에서 반드시 이 스킬을 사용하세요:
  - 사용자가 개발 작업을 시작하거나 코드를 작성/수정할 때
  - git 관련 명령 (add, com, pus, dev, dep, rem 등 단축키 입력 시)
  - "@에이" 를 입력했을 때 (에이전트/MCP/Skill 추천)
  - 히스토리 기록이나 작업 추적이 필요할 때
  - React Native, Hono, Cloudflare Workers, NeonDB 등 풀스택 개발 작업 시
  - 코드 설명을 한국어로 요청할 때
  - 진행상황 리포트나 작업 요약이 필요할 때
compatibility: "bash, create_file, str_replace, view"
---

# 통합 개발 워크플로우 도우미 (Dev Workflow Assistant)

> 이 스킬은 Claude Code 환경에서 개발 프로젝트의 전체 워크플로우를 관리합니다.
> 책 출판을 목표로 한 작업 히스토리 추적, 에이전트 추천, Git 자동화, 한국어 친절 설명을 제공합니다.

---

## 1. 핵심 원칙

1. **히스토리는 절대 삭제하지 않는다** — `history-workflow-book.md`에 추가(append)만 합니다
2. **모든 설명은 한국어로** — 교수님이 학생에게 설명하듯 친절하고 자세하게
3. **코드엔 항상 주석(적요)** — 나중에 수정/학습을 위해, 학생도 이해할 수 있는 수준으로
4. **파일명엔 날짜+시간+명령요약** — 예: `20250410-1430-login-api.ts`
5. **질문 시 에이전트 먼저** — 추천 에이전트/프롬프트를 먼저 보여주고 승인 대기
6. **10분마다 Git 저장** — 백그라운드에서 자동 `git add . && git commit && git push origin main`

---

## 2. 히스토리 워크플로우 기록

### 형식

모든 작업 시작/완료 시 `history-workflow-book.md`에 다음 형식으로 **추가(append)**합니다:

```markdown
---
## [YYYY-MM-DD HH:MM] Order: <작업번호>

**Plan:** <무엇을 할 계획인지>
**Task:** <실제로 수행한 작업>
**Result:** <결과 요약>
**Next:** <다음 단계>
**Agent:** <사용된 에이전트/MCP/Skill>
**Tokens:** ~<사용 토큰 추정>
---
```

### 구현 방법

```bash
# history-workflow-book.md에 항목 추가하는 예시 (절대 기존 내용 삭제 금지)
TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
cat >> history-workflow-book.md << EOF

---
## [$TIMESTAMP] Order: $ORDER_NUM

**Plan:** $PLAN
**Task:** $TASK
**Result:** $RESULT
**Next:** $NEXT
**Agent:** $AGENT
**Tokens:** ~$TOKENS
---
EOF
```

> ⚠️ **주의**: `>` (덮어쓰기)가 아닌 `>>` (추가)를 항상 사용합니다.

---

## 3. 단축 명령어

사용자가 다음 단축키를 입력하면 즉시 해당 명령을 실행합니다:

| 단축키 | 실행 명령 | 설명 |
|--------|-----------|------|
| `dev`  | `npm run dev` + 웹앱 실행 | 개발 서버 시작 |
| `dep`  | `npm run build && npm run deploy` | 빌드 및 배포 |
| `add`  | `git add .` | 스테이징 |
| `com`  | `git commit -m` 입력 후 대기 | 커밋 메시지 입력 대기 |
| `rem`  | `git remote -v` | 원격 저장소 확인 |
| `pus`  | `git add . && git commit -m "auto" && git push origin main` | 전체 푸시 |
| `@에이` | 추천 에이전트/프롬프트/MCP/Skill 보여주기 | 에이전트 추천 |

### 단축키 처리 예시

```bash
# 'pus' 명령 처리
if [ "$INPUT" = "pus" ]; then
  git add .
  COMMIT_MSG="[$(date '+%Y-%m-%d %H:%M')] auto commit"
  git commit -m "$COMMIT_MSG"
  git push origin main
  echo "✅ Push 완료: $COMMIT_MSG"
fi
```

---

## 4. @에이 명령 — 에이전트/MCP/Skill 추천

사용자가 `@에이`를 입력하면 **반드시 승인을 받은 후** 작업을 시작합니다.

### 출력 형식

```markdown
## 🤖 추천 에이전트 & 프롬프트

### 현재 작업: <작업 설명>

**추천 에이전트:** <에이전트 이름>
**추천 MCP:** <MCP 이름 및 URL>
**추천 Skill:** <Skill 이름>

**추천 프롬프트:**
```
<구체적인 프롬프트, 프로그래밍 언어 및 기술 스택 반영>
```

**예상 토큰:** ~<숫자>
**이유:** <왜 이 에이전트/MCP/Skill을 추천하는지>

✅ 이 에이전트와 프롬프트로 진행할까요? (승인하시면 시작합니다)
```

---

## 5. 코드 작성 규칙

### 5-1. 기술 스택별 모델 선택

- **서버/DB 관련** (React Native + Hono, Cloudflare Workers, NeonDB 등): `claude-sonnet-4-20250514` 사용
- **일반 개발**: 현재 세션 모델 사용

### 5-2. 주석(적요) 필수 포함

```typescript
// ============================================================
// 📌 함수명: getUserById
// 📋 목적: 사용자 ID로 데이터베이스에서 사용자 정보를 가져옵니다
// 🔧 매개변수: userId (string) - 조회할 사용자의 고유 ID
// 📤 반환값: User 객체 또는 null (사용자가 없을 경우)
// 📅 작성일: 2025-04-10
// ⚠️ 주의: NeonDB 연결이 필요합니다
// ============================================================
export async function getUserById(userId: string): Promise<User | null> {
  // 데이터베이스 쿼리 실행 - SQL injection 방지를 위해 prepared statement 사용
  const result = await db
    .select()           // 모든 컬럼 선택
    .from(users)        // users 테이블에서
    .where(eq(users.id, userId))  // ID가 일치하는 행만
    .limit(1);          // 최대 1개만 반환

  // 결과가 없으면 null 반환, 있으면 첫 번째 항목 반환
  return result.length > 0 ? result[0] : null;
}
```

### 5-3. 한국어 교수님 톤 설명

```markdown
## 📚 코드 설명 (학생 여러분께)

자, 이 코드가 무엇을 하는지 차근차근 살펴볼게요! 😊

**1단계: 데이터베이스 연결**
NeonDB는 PostgreSQL을 클라우드에서 사용할 수 있게 해주는 서비스예요.
마치 학교 도서관처럼, 우리가 필요한 데이터를 안전하게 보관해 줍니다.

**2단계: Hono 라우터 설정**
Hono는 Cloudflare Workers 위에서 동작하는 초고속 웹 프레임워크예요.
Express.js를 써봤다면 비슷하다고 생각하면 됩니다!
```

---

## 6. 파일명 규칙

```
형식: YYYYMMDD-HHMM-<명령요약>.<확장자>
예시:
  - 20250410-1430-user-auth-api.ts
  - 20250410-1530-db-schema-neon.sql
  - 20250410-1600-login-component.tsx
  - 20250410-1700-deploy-worker.md
```

### 파일 생성 시 자동 날짜 삽입

```bash
# 파일명 자동 생성 함수
generate_filename() {
  local description="$1"
  local extension="$2"
  local timestamp=$(date '+%Y%m%d-%H%M')
  echo "${timestamp}-${description}.${extension}"
}

# 사용 예시
FILENAME=$(generate_filename "user-auth-api" "ts")
# 결과: 20250410-1430-user-auth-api.ts
```

---

## 7. 10분마다 자동 Git 저장

작업 중 10분마다 자동으로 git 저장을 수행합니다.

```bash
# 백그라운드 자동 저장 스크립트
auto_git_save() {
  while true; do
    sleep 600  # 10분 = 600초
    TIMESTAMP=$(date '+%Y-%m-%d %H:%M')
    git add .
    # 변경 파일 목록 가져오기
    CHANGED=$(git diff --cached --name-only | head -5 | tr '\n' ', ')
    if [ -n "$CHANGED" ]; then
      git commit -m "[$TIMESTAMP] 자동 저장: $CHANGED"
      git push origin main
      echo "✅ 자동 저장 완료 ($TIMESTAMP)"
    fi
  done
}
# 백그라운드 실행
auto_git_save &
```

---

## 8. 작업 진행 보고

### 8-1. 1분마다 진행 상황 보고 (긴 작업)

작업이 길어질 경우 매 1분마다:
```markdown
## ⏱️ 진행 상황 보고 [HH:MM]

- ✅ 완료: <완료된 항목>
- 🔄 진행 중: <현재 작업>
- ⏳ 남은 작업: <남은 항목>
- 📊 진행률: XX%
```

### 8-2. 토큰 사용량 보고

```markdown
## 📊 작업 완료 보고

**수행 에이전트:** <에이전트명>
**사용 MCP:** <MCP명>
**사용 Skill:** <Skill명>
**예상 토큰:** ~<숫자> tokens
**작업 시간:** <소요 시간>
```

---

## 9. 명령.md 자동 업데이트

모든 명령 실행 시 `명령.md`에 날짜/시간과 함께 기록합니다:

```bash
# 명령.md 업데이트
update_command_log() {
  local command="$1"
  local result="$2"
  echo "| $(date '+%Y-%m-%d %H:%M') | $command | $result |" >> 명령.md
}
```

---

## 10. 이미지 생성

이미지 요청 시 **최고 퀄리티**를 최우선으로 합니다:
- 해상도: 최대 지원 해상도
- 스타일: 포토리얼리스틱 또는 요청 스타일
- 프롬프트: 상세하고 구체적인 영어 프롬프트 사용

---

## 참고 자료

- 기술 스택 상세: `references/tech-stack.md` 참조
- 에이전트 목록: `./agent/skills/` 디렉터리 참조
- NeonDB + Hono 템플릿: `references/templates.md` 참조