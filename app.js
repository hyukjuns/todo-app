// Supabase 프로젝트 연결 정보
const SUPABASE_URL = 'https://jkjufqisybwebmraoisg.supabase.co';
const SUPABASE_KEY = 'sb_publishable_D_-u7665CwuJbxnHJaAnww_S_06HBoL';

const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_KEY);

// 드래그 중인 todo의 id를 추적 (dragstart ~ drop 사이에 유지)
let dragSrcId = null;

// 중요도 레이블 매핑
const PRIORITY_LABELS = { high: '높음', medium: '중간', low: '낮음' };

// Supabase에서 todos 전체 조회 (position 오름차순)
async function loadTodos() {
  const { data, error } = await db
    .from('todos')
    .select('*')
    .order('position', { ascending: true });
  if (error) { console.error('loadTodos 오류:', error); return []; }
  return data;
}

// 체크된(done) 항목 유무에 따라 삭제 버튼 활성/비활성 전환
function updateBulkActions(todos) {
  const hasChecked = todos.some(t => t.done);
  document.getElementById('delete-checked-btn').disabled = !hasChecked;
}

// 현재 todos를 기반으로 목록 전체를 DOM에 다시 그린다
// 상태 변경(추가/토글/삭제/순서변경) 후 항상 이 함수를 호출해 화면을 동기화
async function renderTodos() {
  const todos = await loadTodos();
  const list = document.getElementById('todo-list');
  list.innerHTML = ''; // 기존 항목 전부 제거 후 재렌더링

  updateBulkActions(todos);

  todos.forEach(todo => {
    const li = document.createElement('li');
    // 완료 상태이면 .done 클래스 추가 → CSS에서 취소선 적용
    if (todo.done) li.classList.add('done');

    // 드래그 핸들
    const handle = document.createElement('span');
    handle.className = 'drag-handle';
    handle.textContent = '⠿';

    // 체크박스: 완료 여부 표시 및 토글 트리거
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.done;
    // 현재 done 값을 직접 전달해 추가 조회 없이 토글
    checkbox.addEventListener('change', () => toggleTodo(todo.id, todo.done));

    // 중요도 뱃지
    const priority = todo.priority || 'medium';
    const badge = document.createElement('span');
    badge.className = `priority-badge priority-${priority}`;
    badge.textContent = PRIORITY_LABELS[priority];

    // 할일 텍스트
    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = todo.text;

    // --- 드래그 앤 드롭 이벤트 ---

    li.draggable = true;

    // 드래그 시작: 현재 항목의 id를 전역 변수에 저장하고 반투명 처리
    li.addEventListener('dragstart', e => {
      dragSrcId = todo.id;
      li.classList.add('dragging');
      e.dataTransfer.effectAllowed = 'move';
    });

    // 드래그 종료: 시각적 상태 초기화
    li.addEventListener('dragend', () => {
      li.classList.remove('dragging');
      document.querySelectorAll('#todo-list li').forEach(el =>
        el.classList.remove('drag-over')
      );
    });

    // 드래그 오버: 기본 동작 차단(드롭 허용), 현재 항목에 drag-over 표시
    li.addEventListener('dragover', e => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      document.querySelectorAll('#todo-list li').forEach(el =>
        el.classList.remove('drag-over')
      );
      li.classList.add('drag-over');
    });

    // 드롭: 새 순서로 배열 재정렬 후 position 값 일괄 업데이트
    li.addEventListener('drop', async e => {
      e.preventDefault();
      if (dragSrcId === todo.id) return;

      const current = await loadTodos();
      const srcIdx = current.findIndex(t => t.id === dragSrcId);
      const dstIdx = current.findIndex(t => t.id === todo.id);

      // splice로 소스 항목을 제거한 뒤 대상 위치에 삽입
      const [moved] = current.splice(srcIdx, 1);
      current.splice(dstIdx, 0, moved);

      // 새 순서를 position 컬럼에 반영 (0부터 순서대로)
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

// 새 todo 항목 추가
// 현재 항목 수를 position으로 사용해 항상 맨 아래에 추가
async function addTodo(text, priority) {
  const trimmed = text.trim();
  if (!trimmed) return;

  // 현재 총 개수를 position 기본값으로 사용
  const { count, error: countError } = await db
    .from('todos')
    .select('*', { count: 'exact', head: true });
  if (countError) { console.error('count 오류:', countError); return; }

  const { error } = await db.from('todos').insert({
    text: trimmed,
    done: false,
    priority,
    position: count ?? 0
  });
  if (error) { console.error('addTodo 오류:', error); return; }
  renderTodos();
}

// 특정 id의 todo 완료 상태를 반전
async function toggleTodo(id, currentDone) {
  const { error } = await db
    .from('todos')
    .update({ done: !currentDone })
    .eq('id', id);
  if (error) { console.error('toggleTodo 오류:', error); return; }
  renderTodos();
}

// 체크된(done) 항목 전체 일괄 삭제
async function deleteCheckedTodos() {
  const { error } = await db
    .from('todos')
    .delete()
    .eq('done', true);
  if (error) { console.error('deleteCheckedTodos 오류:', error); return; }
  renderTodos();
}

// 추가 버튼 클릭: 입력값 + 선택된 중요도로 todo 추가 후 입력창 초기화
document.getElementById('add-btn').addEventListener('click', () => {
  const input = document.getElementById('todo-input');
  const priority = document.getElementById('priority-select').value;
  addTodo(input.value, priority);
  input.value = '';
  input.focus();
});

// Enter 키로 todo 추가 (버튼 클릭 없이 바로 등록)
document.getElementById('todo-input').addEventListener('keydown', e => {
  if (e.key === 'Enter') {
    const priority = document.getElementById('priority-select').value;
    addTodo(e.target.value, priority);
    e.target.value = '';
  }
});

// 일괄 삭제 버튼 클릭: 체크된 항목 전체 제거
document.getElementById('delete-checked-btn').addEventListener('click', deleteCheckedTodos);

// 페이지 로드 시 Supabase에서 todos를 조회해 화면에 표시
renderTodos();
