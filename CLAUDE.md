# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 작업 범위

**`src/exercise/hyukjuns/day02/todo/` 디렉토리만 수정한다.** 다른 팀원 디렉토리(`src/exercise/` 하위 다른 폴더)는 절대 건드리지 않는다.

## 공유 레포 규칙

1. **hyukjuns 디렉토리만 수정** — 다른 팀원 디렉토리는 절대 수정하지 않는다
2. **스테이징 시 경로 명시** — `git add .` 또는 `git add -A` 사용 금지, 반드시 `src/exercise/hyukjuns/` 경로 지정
3. **push 전 반드시 pull 먼저 실행**
4. **git commit은 사용자가 명시적으로 요청할 때만 실행** — 작업 완료 후 자동으로 커밋하지 않는다

```bash
git pull --no-edit
git add src/exercise/hyukjuns/
git commit -m "메시지"
git push
```

## Git Commit & Push 경고 규칙

`git commit` 또는 `git push` 실행 전, 스테이징된 파일 목록(`git diff --cached --name-only`)을 반드시 확인한다.

**`src/exercise/hyukjuns/day02/todo/` 경로 외의 파일이 단 하나라도 포함되어 있으면 즉시 동작을 멈추고 아래 형식으로 경고한다:**

```
⚠️ 경고: 허용 범위 외 파일이 스테이징되어 있습니다.
허용 경로: src/exercise/hyukjuns/day02/todo/
범위 외 파일:
  - <파일 경로>
commit & push를 중단합니다. 스테이징을 확인해 주세요.
```

경고 후 사용자의 명시적 승인 없이는 commit & push를 진행하지 않는다.

## WORKFLOW.md 기록 규칙

작업이 완료될 때마다 `WORKFLOW.md`에 기록한다:

- **사용자 프롬프트**: 원문 그대로 `>` 블록 인용으로 기록
- **수행 작업**: Claude의 작업 내용을 요약해서 기록
- 파일 위치: `src/exercise/hyukjuns/day02/todo/WORKFLOW.md`

예시:
```
## N. 작업 제목

**사용자 프롬프트:**
> 사용자가 입력한 프롬프트 원문

**수행 작업 요약:**
- 작업 내용 요약
```
