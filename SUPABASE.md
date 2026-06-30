# Supabase 연동 가이드 (Todo App)

Supabase는 Firebase 대안으로, PostgreSQL 기반의 BaaS(Backend as a Service)다.  
이 가이드는 순수 HTML/CSS/JS 앱에서 localStorage 대신 Supabase를 사용하도록 전환하는 방법을 다룬다.

---

## 1. Supabase 프로젝트 생성

1. [https://supabase.com](https://supabase.com) 접속 → **Start your project** → GitHub로 로그인
2. **New project** 클릭
3. 아래 항목 입력:
   - **Name**: `todo-app`
   - **Database Password**: 안전한 비밀번호 입력 (어딘가에 저장해 둘 것)
   - **Region**: `Northeast Asia (Seoul)` 권장
4. **Create new project** 클릭 → 약 1~2분 대기

---

## 2. 데이터 테이블 생성

프로젝트 대시보드 → 왼쪽 메뉴 **SQL Editor** → **New query** → 아래 SQL 실행

```sql
CREATE TABLE todos (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  text text NOT NULL,
  done boolean NOT NULL DEFAULT false,
  priority text NOT NULL DEFAULT 'medium'
    CHECK (priority IN ('high', 'medium', 'low')),
  position integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

### 컬럼 설명

| 컬럼 | 타입 | 설명 |
|------|------|------|
| `id` | uuid | 기본키, 자동 생성 |
| `text` | text | 할일 내용 |
| `done` | boolean | 완료 여부 (기본: false) |
| `priority` | text | 중요도: `high` / `medium` / `low` |
| `position` | integer | 드래그 순서 저장용 |
| `created_at` | timestamptz | 생성 시각, 자동 기록 |

---

## 3. Row Level Security (RLS) 설정

Supabase는 기본적으로 RLS가 활성화되어 있어 정책 없이는 데이터 접근이 불가하다.  
이 앱은 로그인 없이 누구나 사용하므로, **익명(anon) 접근을 허용**하는 정책을 추가한다.

SQL Editor에서 실행:

```sql
-- RLS 활성화
ALTER TABLE todos ENABLE ROW LEVEL SECURITY;

-- anon 키로 전체 허용 (읽기/쓰기/수정/삭제)
CREATE POLICY "public access"
  ON todos
  FOR ALL
  TO anon
  USING (true)
  WITH CHECK (true);
```

> **주의**: 이 설정은 누구나 데이터를 읽고 쓸 수 있다. 개인 용도 앱에 적합하며, 다중 사용자 서비스라면 인증(Auth) 연동이 필요하다.

---

## 4. API 키 확인

프로젝트 대시보드 → **Project Settings** → **API**

아래 두 값을 복사해 둔다:

| 항목 | 설명 |
|------|------|
| **Project URL** | `https://xxxx.supabase.co` 형태 |
| **anon / public key** | 클라이언트에서 사용하는 공개 키 |

---

## 5. HTML에 Supabase 클라이언트 추가 (CDN)

`index.html`의 `<head>` 또는 `<script>` 앞에 추가:

```html
<script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
```

---

## 6. app.js에서 Supabase 초기화

```js
const SUPABASE_URL = 'https://xxxx.supabase.co';   // Project URL
const SUPABASE_KEY = 'your-anon-public-key';        // anon key

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);
```

---

## 7. 기본 CRUD 예시

기존 localStorage 함수를 아래 Supabase 호출로 대체한다.

### 전체 조회 (position 순서대로)
```js
const { data, error } = await db
  .from('todos')
  .select('*')
  .order('position', { ascending: true });
```

### 항목 추가
```js
const { error } = await db.from('todos').insert({
  text: '할일 내용',
  done: false,
  priority: 'medium',
  position: 마지막_position + 1
});
```

### 완료 여부 토글
```js
const { error } = await db
  .from('todos')
  .update({ done: true })
  .eq('id', todoId);
```

### 항목 삭제 (체크된 항목 일괄)
```js
const { error } = await db
  .from('todos')
  .delete()
  .eq('done', true);
```

### 드래그 후 순서 업데이트
```js
// todos 배열을 새 순서대로 position 값 일괄 업데이트
await Promise.all(
  todos.map((todo, index) =>
    db.from('todos').update({ position: index }).eq('id', todo.id)
  )
);
```

---

## 8. 전환 시 주요 변경 포인트

| 기존 (localStorage) | 변경 후 (Supabase) |
|---|---|
| `loadTodos()` 동기 | `await db.from('todos').select()` 비동기 |
| `saveTodos()` 즉시 | 각 작업별 insert/update/delete 호출 |
| id: `Date.now()` | id: `uuid` (Supabase 자동 생성) |
| 순서: 배열 인덱스 | 순서: `position` 컬럼 |
| 앱 함수 전부 동기 | `async/await` 패턴으로 전환 필요 |

---

## 9. 로컬 데이터 마이그레이션 (선택)

기존 localStorage 데이터를 Supabase로 옮기려면 브라우저 콘솔에서 실행:

```js
const old = JSON.parse(localStorage.getItem('day02-todos')) || [];
await Promise.all(
  old.map((t, i) =>
    db.from('todos').insert({
      text: t.text,
      done: t.done,
      priority: t.priority || 'medium',
      position: i
    })
  )
);
console.log('마이그레이션 완료');
```
