# 작업 워크플로우 (Day02 - Todo)

## 2. Todo 앱 구현

**사용자 프롬프트:**
> 간단한 todo 앱 만들거야, 할일 등록, 실행 여부 체크를 위한 체크박스, 할일 삭제 버튼 이 주요 기능이고, 데이터는 로컬스토리지에 저장할거야, 간단하게 html, css, js 만으로 애플리케이션 코드 작성해줘

**수행 작업 요약:**
- `index.html` 생성 — 입력창 + 추가 버튼, 할일 목록 컨테이너(`<ul>`)
- `style.css` 생성 — 라이트 테마 카드 레이아웃, 완료 항목 취소선(`.done`), 삭제 버튼 빨간 계열
- `app.js` 생성
  - Todo 데이터 구조: `{ id: Date.now(), text, done }`
  - `loadTodos()` / `saveTodos()` — localStorage JSON 직렬화
  - `renderTodos()` — 목록 전체 재렌더링
  - `addTodo()` / `toggleTodo()` / `deleteTodo()` — CRUD
  - Enter 키로 할일 추가 지원

---

## 9. GitHub Pages 배포 가이드 작성

**사용자 프롬프트:**
> 이제 github pages로 앱을 배포할거야 hyukjuns github 계정에서 todo-app 이라는 repo를 새로 만들어서 배포할거고, 해당 repo에서 github pages로  배포하는 방법을 요약해서 현재 디렉토리의 GITHUB_PAGES.md 파일에 작성해줘, 보면서 따라서 하도록 순서대로 작성해줘

**수행 작업 요약:**
- `GITHUB_PAGES.md` 생성 — 아래 순서로 배포 절차 작성
  1. GitHub 웹에서 `todo-app` 저장소 생성 (빈 repo, Public)
  2. `git subtree push --prefix=src/exercise/hyukjuns/day02/todo` 명령으로 서브디렉토리만 새 repo에 push
  3. GitHub Pages 설정 (Settings → Pages → Branch: main, / root → Save)
  4. 배포 URL 확인 (`https://hyukjuns.github.io/todo-app/`)
  5. 이후 업데이트 시 동일 subtree push 명령 재실행

---

## 8. 삭제 버튼 위치 이동 — input-row 안 추가 버튼 오른쪽으로

**사용자 프롬프트:**
> todo 항목 옆에 삭제 라는 버튼이 아직 남아 있어, todo 항목에는 삭제라는 버튼이 없애고 싶어, 그리고 상단 삭제 버튼은 '추가' 버튼 오른쪽에 위치시켜줘

**수행 작업 요약:**
- `index.html` 수정 — `#bulk-actions` div 제거, `#delete-checked-btn`을 `.input-row` 안 `#add-btn` 바로 다음으로 이동
- `style.css` 수정 — `#bulk-actions` 관련 스타일 제거

---

## 7. 삭제 버튼 UX 개선 — 상단 고정, 개별 삭제 버튼 제거

**사용자 프롬프트:**
> 지금 체크박스 누르면 체크 항목 삭제 버튼이 갑자기 나타나는데, 그냥 삭제버튼을 상단에 하나 두고, 각 항목 옆에 삭제 버튼은 제거해줘, 즉 사용자는 체크박스 누르고 상단의 삭제 버튼을 누르도록 하고 싶어

**수행 작업 요약:**
- `index.html` 수정 — `#delete-checked-btn`에 `disabled` 초기값 설정, 버튼명 "삭제"로 단순화
- `style.css` 수정
  - `#bulk-actions` 항상 표시(`display: flex`) 로 변경, `.visible` 토글 제거
  - `#delete-checked-btn:disabled` — `opacity: 0.35` + `cursor: not-allowed`로 비활성 상태 표시
  - 개별 `.delete-btn` 스타일 제거
- `app.js` 수정
  - `updateBulkActions()` — `.visible` 클래스 토글 → `button.disabled` 속성 토글 방식으로 변경
  - `renderTodos()` 내 개별 삭제 버튼(`deleteBtn`) 생성 코드 제거
  - 사용하지 않는 `deleteTodo(id)` 함수 제거

---

## 6. 체크 항목 일괄 삭제 기능 추가

**사용자 프롬프트:**
> todo app에서 현재는 1개의 항목을 삭제할 수 있는데, 체크박스를 체크한 항목은 일괄 삭제가 가능하도록 기능을 추가해줘

**수행 작업 요약:**
- `index.html` 수정 — 목록 위에 `#bulk-actions` 영역 + `#delete-checked-btn` 버튼 추가
- `style.css` 수정 — `#bulk-actions` 기본 숨김(`display: none`), `.visible` 클래스 시 `flex` 표시 / 버튼 빨간 계열 스타일
- `app.js` 수정
  - `updateBulkActions(todos)` — `todos.some(t => t.done)` 결과에 따라 버튼 표시/숨김 토글
  - `renderTodos()` 내부에 `updateBulkActions()` 호출 추가 (체크 상태 변경 시 즉시 반영)
  - `deleteCheckedTodos()` — `filter(t => !t.done)`으로 체크된 항목 전체 제거 후 저장·렌더링
  - `#delete-checked-btn` 클릭 이벤트 등록

---

## 5. 중요도 라벨 + 드래그 순서 변경 기능 추가

**사용자 프롬프트:**
> todo app에 중요도라벨선택 기능 (높음,중간,낮음),위아래 순서 옮길 수 있는 드래그 기능 2가지를 추가해줘

**수행 작업 요약:**
- `index.html` 수정 — 입력 영역에 `<select id="priority-select">` 추가 (높음/중간/낮음, 기본값 중간)
- `style.css` 수정
  - `#priority-select` 스타일 추가
  - `.priority-badge` 공통 + `.priority-high`(빨강) / `.priority-medium`(주황) / `.priority-low`(초록) 뱃지 스타일
  - `.drag-handle` (⠿ 아이콘, grab 커서)
  - `.dragging` (드래그 중 반투명), `.drag-over` (드롭 대상 파란 테두리) 상태 스타일
- `app.js` 수정
  - Todo 데이터 구조에 `priority` 필드 추가 (`high` | `medium` | `low`, 기존 데이터 미존재 시 `medium` 기본값)
  - `PRIORITY_LABELS` 매핑 상수, `dragSrcId` 전역 추적 변수 추가
  - `renderTodos()` — 드래그 핸들(⠿), 중요도 뱃지, HTML5 Drag & Drop 이벤트(`dragstart`/`dragend`/`dragover`/`drop`) 추가
  - `drop` 이벤트: `splice`로 소스 항목 제거 후 대상 위치에 삽입해 배열 순서 변경 → `saveTodos` + `renderTodos`
  - `addTodo(text, priority)` — priority 파라미터 추가, 버튼 클릭/Enter 시 셀렉트 값 전달

---

## 4. CLAUDE.md 지침 추가 — commit & push 경고 규칙

**사용자 프롬프트:**
> 앞서 생성한 CLAUDE.md에 지침 추가해줘, 추가할 지침은 이거야, git commit & push 할때 etevers-vibecoding-2026-1st/src/exercise/hyukjuns/day02/todo 폴더 외에 다른 경로의 파일을 commit & push 할거 같으면 동작을 멈추고 나에게 경고를 알려주도록 지침을 추가해줘

**수행 작업 요약:**
- `CLAUDE.md` 수정 — "Git Commit & Push 경고 규칙" 섹션 추가
  - commit/push 전 `git diff --cached --name-only`로 스테이징 파일 확인 의무화
  - `src/exercise/hyukjuns/day02/todo/` 외 경로 파일 감지 시 경고 메시지 출력 후 동작 중단
  - 사용자 명시적 승인 없이 진행 금지

---

## 3. 코드 주석 추가

**사용자 프롬프트:**
> 애플리케이션 코드의 주요 항목과 중요한 로직에 주석을 달아줘

**수행 작업 요약:**
- `app.js` 수정 — 함수별 역할, 핵심 로직(localStorage 키, JSON 파싱 예외처리, Date.now() id 전략, renderTodos 재렌더링 방식, done 토글, filter 기반 삭제) 주석 추가
- `index.html` 수정 — 입력 영역, 목록 컨테이너, script 태그 위치(DOM 파싱 완료 후 실행), autocomplete 속성 목적 주석 추가

---

## 1. CLAUDE.md 및 WORKFLOW.md 초기화

**사용자 프롬프트:**
> hyukjuns/day02/todo 에서만 작업을 할거고, 내가 입력한 모든 프롬프트는 원본 그대로 유지하고, 그에 대한 결과를 요약해서 WORKFLOW.md에 기록하도록 CLAUDE.md를 작성해줘

**수행 작업 요약:**
- `CLAUDE.md` 생성 — 작업 범위(`day02/todo` 디렉토리), 공유 레포 규칙(4가지), WORKFLOW.md 기록 규칙(프롬프트 원문 + 요약 구조) 명시
- `WORKFLOW.md` 생성 — 작업 이력 기록 파일 초기화
