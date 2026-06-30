# AUTH-PLAN.md — Todo 앱 Google 로그인 구현 계획

## 개요

| 항목 | 내용 |
|------|------|
| **목적** | Google 계정으로만 로그인 가능하도록 변경, 사용자별 데이터 격리 |
| **인증 방식** | Google OAuth 2.0 (Supabase 연동) |
| **수정 파일** | `index.html` / `app.js` / `style.css` |
| **외부 설정** | Google Cloud Console + Supabase Dashboard |

---

## 전체 흐름

```
[사용자]
    │
    ▼
 앱 열기 (http://localhost:5500)
    │
    ├─ 비로그인 → Google 버튼 화면 표시
    │               │
    │               ▼
    │        "Google로 로그인" 클릭
    │               │
    │               ▼
    │        Google 계정 선택 페이지 (브라우저 이동)
    │               │
    │               ▼
    │        Google → Supabase 콜백 URL로 인증 코드 전달
    │               │
    │               ▼
    │        Supabase → 세션 생성 → 앱으로 복귀
    │               │
    │               ▼
    └─ 로그인됨 → 할일 목록 표시 (본인 데이터만)
```

---

## 배포 URL

```
https://hyukjuns.github.io/todo-app/
```

> 이 URL을 기준으로 Supabase와 Google Cloud Console 설정을 진행한다.  
> 코드 수정 후 아래 명령으로 재배포한다.

```bash
# 프로젝트 루트(etevers-vibecoding-2026-1st/)에서 실행
git subtree push --prefix=src/exercise/hyukjuns/day02/todo https://github.com/hyukjuns/todo-app.git main
```

---

## Step 1 — Supabase: DB 수정 (SQL Editor)

> Supabase 대시보드 → SQL Editor → New query

```sql
-- ① todos 테이블에 user_id 컬럼 추가
ALTER TABLE todos
  ADD COLUMN user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE;

-- ② 기존 anon 전체 허용 정책 제거
DROP POLICY "public access" ON todos;

-- ③ 인증된 사용자만 자신의 데이터에만 접근
CREATE POLICY "user isolation"
  ON todos FOR ALL TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

> ⚠️ 기존 todos는 `user_id = NULL`이므로 정책 적용 후 아무에게도 보이지 않음  
> 기존 데이터 보존이 필요하면: `UPDATE todos SET user_id = '<본인 uid>'`

---

## Step 2 — Supabase: Redirect URL 등록

> Supabase 대시보드 → Authentication → URL Configuration

```
Site URL          : https://hyukjuns.github.io/todo-app/
Redirect URLs 추가 : https://hyukjuns.github.io/todo-app/
```

---

## Step 3 — Google Cloud Console: OAuth 앱 등록

> [console.cloud.google.com](https://console.cloud.google.com)

```
1. 프로젝트 생성 (또는 기존 프로젝트 선택)

2. APIs & Services
   → Credentials
   → Create Credentials
   → OAuth 2.0 Client IDs

3. Application type: Web application

4. Authorized redirect URIs 에 추가:
   https://jkjufqisybwebmraoisg.supabase.co/auth/v1/callback
   
5. Authorized JavaScript origins 에 추가:
   https://hyukjuns.github.io

5. Client ID, Client Secret 복사해 둠
```

---

## Step 4 — Supabase: Google Provider 활성화

> Supabase 대시보드 → Authentication → Providers → Google

```
Enable          : ON
Client ID       : (Step 3에서 복사한 값)
Client Secret   : (Step 3에서 복사한 값)
→ Save
```

---

## Step 5 — index.html 수정

기존 `<div class="container">` 를 두 섹션으로 분리한다.

```html
<body>
  <!-- 로그인 화면 (비로그인 시 표시) -->
  <div id="auth-section" class="auth-section">
    <h1>Todo</h1>
    <p class="auth-desc">Google 계정으로 로그인하세요</p>
    <button id="google-login-btn" class="google-btn">
      <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" alt="" width="20">
      Google로 로그인
    </button>
    <p id="auth-message"></p>
  </div>

  <!-- 앱 화면 (로그인 후 표시) -->
  <div id="app-section" class="container hidden">
    <div class="app-header">
      <h1>Todo</h1>
      <div class="user-info">
        <img id="user-avatar" class="user-avatar" src="" alt="" width="28">
        <span id="user-email-display"></span>
        <button id="logout-btn">로그아웃</button>
      </div>
    </div>

    <!-- 기존 input-row + todo-list 그대로 유지 -->
    <div class="input-row"> ... </div>
    <ul id="todo-list"></ul>
  </div>

  <script src="app.js"></script>
</body>
```

---

## Step 6 — app.js 수정

### 추가할 전역 변수

```js
let currentUser = null;
```

### 추가할 함수 3개

```js
// Google 로그인 시작 → 브라우저가 Google 페이지로 이동
async function signInWithGoogle() {
  await db.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin }
  });
}

// 로그아웃
async function signOut() {
  await db.auth.signOut();
}

// 인증 상태 감지 (로그인/로그아웃/새로고침 시 자동 호출)
db.auth.onAuthStateChange((event, session) => {
  currentUser = session?.user ?? null;
  if (currentUser) {
    document.getElementById('auth-section').classList.add('hidden');
    document.getElementById('app-section').classList.remove('hidden');
    document.getElementById('user-email-display').textContent = currentUser.email;
    document.getElementById('user-avatar').src = currentUser.user_metadata.avatar_url ?? '';
    renderTodos();
  } else {
    document.getElementById('app-section').classList.add('hidden');
    document.getElementById('auth-section').classList.remove('hidden');
    document.getElementById('todo-list').innerHTML = '';
  }
});
```

### addTodo() — user_id 한 줄 추가

```js
// 변경 전
await db.from('todos').insert({ text, done: false, priority, position });

// 변경 후
await db.from('todos').insert({ text, done: false, priority, position, user_id: currentUser.id });
```

### 이벤트 바인딩 추가

```js
document.getElementById('google-login-btn').addEventListener('click', signInWithGoogle);
document.getElementById('logout-btn').addEventListener('click', signOut);
```

---

## Step 7 — style.css 추가

```css
/* 로그인 화면 */
.auth-section {
  background: #fff;
  border-radius: 12px;
  box-shadow: 0 2px 16px rgba(0,0,0,0.08);
  padding: 40px 32px;
  max-width: 360px;
  margin: 0 auto;
  text-align: center;
  height: fit-content;
}
.auth-desc { font-size: 0.9rem; color: #8892c8; margin-bottom: 28px; }

/* Google 버튼 */
.google-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 10px;
  width: 100%;
  padding: 11px 16px;
  background: #fff;
  color: #3c4043;
  border: 1.5px solid #dadce0;
  border-radius: 8px;
  font-size: 0.95rem;
  font-family: inherit;
  font-weight: 500;
  cursor: pointer;
  transition: background 0.15s, box-shadow 0.15s;
}
.google-btn:hover { background: #f8f9fa; box-shadow: 0 1px 4px rgba(0,0,0,0.12); }

/* 앱 헤더 */
.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}
.app-header h1 { margin-bottom: 0; }
.user-info { display: flex; align-items: center; gap: 8px; }
.user-avatar { border-radius: 50%; }
#user-email-display { font-size: 0.82rem; color: #8892c8; }

/* 로그아웃 버튼 */
#logout-btn {
  padding: 6px 12px;
  background: #fff0f0;
  color: #e05c5c;
  border: 1px solid #f5c0c0;
  border-radius: 8px;
  font-size: 0.82rem;
  font-family: inherit;
  cursor: pointer;
}
#logout-btn:hover { background: #e05c5c; color: #fff; }

/* 공통 */
.hidden { display: none !important; }
```

---

## 실행 순서 요약

```
Step 1  Supabase SQL 실행      todos 테이블 user_id 추가 + RLS 교체
Step 2  Supabase Redirect URL  localhost 주소 등록
Step 3  Google Cloud Console   OAuth 앱 생성 + 콜백 URL 등록
Step 4  Supabase Provider      Google Client ID / Secret 입력
Step 5  index.html             로그인/앱 섹션 분리
Step 6  app.js                 signInWithGoogle + onAuthStateChange + addTodo 수정
Step 7  style.css              Google 버튼 + 헤더 스타일
```

---

## 검증 체크리스트

```
□ https://hyukjuns.github.io/todo-app/ 접속 시 Google 버튼 화면만 표시
□ "Google로 로그인" 클릭 → Google 계정 선택 페이지 이동
□ 로그인 완료 → 앱 화면 + 프로필 사진 + 이메일 표시
□ 할일 추가 → Supabase 콘솔에서 user_id 값 확인
□ 로그아웃 → 로그인 화면 복귀
□ 새로고침 → 로그인 상태 유지 (세션 자동 복원)
□ 다른 Google 계정 로그인 → 각자 할일만 보임 (데이터 격리)
```

---

## 재배포 방법

코드 수정 후 아래 두 단계로 GitHub Pages에 반영한다.

```bash
# 1. 공유 레포에 커밋
git add src/exercise/hyukjuns/day02/todo/
git commit -m "feat: Google 로그인 추가"
git push

# 2. todo-app 레포에 배포
git subtree push --prefix=src/exercise/hyukjuns/day02/todo https://github.com/hyukjuns/todo-app.git main
```
