const SUPABASE_URL = 'https://jkjufqisybwebmraoisg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_D_-u7665CwuJbxnHJaAnww_S_06HBoL';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

let dragSrcId = null;
let currentUser = null;

const PRIORITY_LABELS = { high: '높음', medium: '중간', low: '낮음' };

// ── 인증 ──────────────────────────────────────────────

// Google OAuth 로그인: Google 계정 선택 페이지로 이동
async function signInWithGoogle() {
  const { error } = await db.auth.signInWithOAuth({
    provider: 'google',
    options: { redirectTo: window.location.origin + window.location.pathname }
  });
  if (error) {
    document.getElementById('auth-message').textContent = '로그인 중 오류가 발생했습니다.';
    console.error('signInWithGoogle 오류:', error);
  }
}

// 로그아웃
async function signOut() {
  const { error } = await db.auth.signOut();
  if (error) { console.error('signOut 오류:', error); }
}

// 인증 상태 감지: 로그인/로그아웃/페이지 새로고침 시 자동 호출
db.auth.onAuthStateChange((event, session) => {
  currentUser = session?.user ?? null;
  if (currentUser) {
    showApp();
    renderTodos();
  } else {
    showAuth();
  }
});

function showApp() {
  document.getElementById('auth-section').classList.add('hidden');
  document.getElementById('app-section').classList.remove('hidden');
  document.getElementById('user-email-display').textContent = currentUser.email;
  const avatar = currentUser.user_metadata?.avatar_url ?? '';
  const avatarEl = document.getElementById('user-avatar');
  avatarEl.src = avatar;
  avatarEl.style.display = avatar ? 'block' : 'none';
}

function showAuth() {
  document.getElementById('app-section').classList.add('hidden');
  document.getElementById('auth-section').classList.remove('hidden');
  document.getElementById('todo-list').innerHTML = '';
}

// ── 데이터 조회 ───────────────────────────────────────

// RLS 정책이 auth.uid() = user_id 로 자동 필터링하므로 별도 조건 불필요
async function loadTodos() {
  const { data, error } = await db
    .from('todos')
    .select('*')
    .order('position', { ascending: true });
  if (error) { console.error('loadTodos 오류:', error); return []; }
  return data;
}

// ── 렌더링 ────────────────────────────────────────────

function updateBulkActions(todos) {
  const hasChecked = todos.some(t => t.done);
  document.getElementById('delete-checked-btn').disabled = !hasChecked;
}

async function renderTodos() {
  const todos = await loadTodos();
  const list = document.getElementById('todo-list');
  list.innerHTML = '';

  updateBulkActions(todos);

  todos.forEach(todo => {
    const li = document.createElement('li');
    if (todo.done) li.classList.add('done');

    const handle = document.createElement('span');
    handle.className = 'drag-handle';
    handle.textContent = '⠿';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.done;
    checkbox.addEventListener('change', () => toggleTodo(todo.id, todo.done));

    const priority = todo.priority || 'medium';
    const badge = document.createElement('span');
    badge.className = `priority-badge priority-${priority}`;
    badge.textContent = PRIORITY_LABELS[priority];

    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = todo.text;

    li.draggable = true;

    li.addEventListener('dragstart', e => {
      dragSrcId = todo.id;
      li.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
      document.querySelectorAll('#todo-list li').forEach(el =>
        el.classList.remove('drag-over')
      );
    });

    li.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      document.querySelectorAll('#todo-list li').forEach(el =>
        el.classList.remove('drag-over')
      );
      li.classList.add('drag-over');
    });

    li.addEventListener('drop', async e => {
      e.preventDefault();
      if (dragSrcId === todo.id) return;

      const current = await loadTodos();
      const srcIdx = current.findIndex(t => t.id === dragSrcId);
      const dstIdx = current.findIndex(t => t.id === todo.id);

      const [moved] = current.splice(srcIdx, 1);
      current.splice(dstIdx, 0, moved);

      await Promise.all(
        current.map((t, i) =>
          db.from('todos').update({ position: i }).eq('id', t.id)
        )
      );
      renderTodos();
    });

    li.appendChild(handle);
    li.appendChild(checkbox);
    li.appendChild(badge);
    li.appendChild(span);
    list.appendChild(li);
  });
}

// ── CRUD ─────────────────────────────────────────────

async function addTodo(text, priority) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const { count, error: countError } = await db
    .from('todos')
    .select('*', { count: 'exact', head: true });
  if (countError) { console.error('count 오류:', countError); return; }

  const { error } = await db.from('todos').insert({
    text: trimmed,
    done: false,
    priority,
    position: count ?? 0,
    user_id: currentUser.id
  });
  if (error) { console.error('addTodo 오류:', error); return; }
  renderTodos();
}

async function toggleTodo(id, currentDone) {
  const { error } = await db
    .from('todos')
    .update({ done: !currentDone })
    .eq('id', id);
  if (error) { console.error('toggleTodo 오류:', error); return; }
  renderTodos();
}

async function deleteCheckedTodos() {
  const { error } = await db
    .from('todos')
    .delete()
    .eq('done', true);
  if (error) { console.error('deleteCheckedTodos 오류:', error); return; }
  renderTodos();
}

// ── 이벤트 바인딩 ─────────────────────────────────────

document.getElementById('google-login-btn').addEventListener('click', signInWithGoogle);
document.getElementById('logout-btn').addEventListener('click', signOut);

document.getElementById('add-btn').addEventListener('click', () => {
  const input = document.getElementById('todo-input');
  const priority = document.getElementById('priority-select').value;
  addTodo(input.value, priority);
  input.value = '';
  input.focus();
});

document.getElementById('todo-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const priority = document.getElementById('priority-select').value;
    addTodo(e.target.value, priority);
    e.target.value = '';
  }
});

document.getElementById('delete-checked-btn').addEventListener('click', deleteCheckedTodos);
