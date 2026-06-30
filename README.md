# Todo App

**GitHub Pages:** https://hyukjuns.github.io/todo-app/

Google 계정으로 로그인하여 사용하는 할일 관리 웹 애플리케이션입니다.

---

## 주요 기능

- Google OAuth 로그인 — 인증된 사용자만 앱 사용 가능
- 할일 추가 / 체크 / 일괄 삭제
- 중요도 라벨 (높음 / 중간 / 낮음)
- 드래그 앤 드롭으로 순서 변경
- 사용자별 데이터 격리 (Supabase RLS)

---

## 기술 스택

| 구분 | 내용 |
|------|------|
| Frontend | HTML, CSS, Vanilla JS |
| Backend | Supabase (PostgreSQL + Auth) |
| 인증 | Google OAuth 2.0 (Supabase 연동) |
| 배포 | GitHub Pages |

---

## 프로젝트 구조

```
todo/
├── index.html        # 앱 진입점 — 로그인 섹션 / 앱 섹션 분리
├── style.css         # 전체 스타일 (로그인 화면, 카드 목록, 반응형)
├── app.js            # 핵심 로직 (인증, CRUD, 드래그 앤 드롭)
├── AUTH-PLAN.md      # Google OAuth 구현 계획
├── SUPABASE.md       # Supabase 연동 가이드
├── GITHUB_PAGES.md   # GitHub Pages 배포 가이드
├── WORKFLOW.md       # 작업 이력
└── CLAUDE.md         # Claude Code 작업 지침
```

### index.html

- `#auth-section` — 비로그인 시 표시되는 Google 로그인 버튼 화면
- `#app-section` — 로그인 후 표시되는 할일 목록 화면 (프로필, 로그아웃 포함)

### app.js

| 함수 | 역할 |
|------|------|
| `signInWithGoogle()` | Google OAuth 로그인 시작 |
| `signOut()` | 로그아웃 |
| `onAuthStateChange` | 인증 상태 감지 및 UI 전환 |
| `loadTodos()` | Supabase에서 할일 목록 조회 (RLS 자동 필터) |
| `renderTodos()` | 할일 목록 DOM 렌더링 |
| `addTodo()` | 할일 추가 (`user_id` 포함) |
| `toggleTodo()` | 체크박스 토글 |
| `deleteCheckedTodos()` | 체크된 항목 일괄 삭제 |

### Supabase 테이블 (`todos`)

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid | 기본키 |
| `text` | text | 할일 내용 |
| `done` | boolean | 완료 여부 |
| `priority` | text | 중요도 (high / medium / low) |
| `position` | integer | 표시 순서 |
| `user_id` | uuid | 소유 사용자 (RLS 기준) |
| `created_at` | timestamptz | 생성 시각 |

---
