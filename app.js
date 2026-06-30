// localStorage에서 todos를 식별하기 위한 키
const STORAGE_KEY = 'day02-todos';

// 드래그 중인 todo의 id를 추적 (dragstart ~ drop 사이에 유지)
let dragSrcId = null;

// 중요도 레이블 매핑
const PRIORITY_LABELS = { high: '높음', medium: '중간', low: '낮음' };

// localStorage에서 todos 배열을 읽어 반환
// JSON 파싱 실패(손상된 데이터) 시 빈 배열로 초기화
function loadTodos() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY)) || [];
  } catch {
    return [];
  }
}

// todos 배열을 JSON 문자열로 직렬화해 localStorage에 저장
function saveTodos(todos) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

// 체크된(done) 항목 유무에 따라 삭제 버튼 활성/비활성 전환
function updateBulkActions(todos) {
  const hasChecked = todos.some(t => t.done);
  document.getElementById('delete-checked-btn').disabled = !hasChecked;
}

// 현재 todos를 기반으로 목록 전체를 DOM에 다시 그린다
// 상태 변경(추가/토글/삭제/순서변경) 후 항상 이 함수를 호출해 화면을 동기화
function renderTodos() {
  const todos = loadTodos();
  const list = document.getElementById('todo-list');
  list.innerHTML = ''; // 기존 항목 전부 제거 후 재렌더링

  updateBulkActions(todos); // 체크 항목 유무에 따라 일괄 삭제 버튼 표시 여부 갱신

  todos.forEach(todo => {
    const li = document.createElement('li');
    // 완료 상태이면 .done 클래스 추가 → CSS에서 취소선 적용
    if (todo.done) li.classList.add('done');

    // 드래그 핸들: 사용자가 잡고 드래그할 영역
    const handle = document.createElement('span');
    handle.className = 'drag-handle';
    handle.textContent = '⠿';

    // 체크박스: 완료 여부 표시 및 토글 트리거
    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = todo.done;
    checkbox.addEventListener('change', () => toggleTodo(todo.id));

    // 중요도 뱃지: 기존 데이터에 priority 없으면 'medium' 기본값
    const priority = todo.priority || 'medium';
    const badge = document.createElement('span');
    badge.className = `priority-badge priority-${priority}`;
    badge.textContent = PRIORITY_LABELS[priority];

    // 할일 텍스트
    const span = document.createElement('span');
    span.className = 'todo-text';
    span.textContent = todo.text;

    // --- 드래그 앤 드롭 이벤트 ---

    // draggable 속성을 li 전체에 적용
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

    // 드롭: 드래그 소스와 드롭 대상의 배열 인덱스를 교환해 순서 변경
    li.addEventListener('drop', e => {
      e.preventDefault();
      if (dragSrcId === todo.id) return; // 자기 자신 위에 드롭 시 무시

      const todos = loadTodos();
      const srcIdx = todos.findIndex(t => t.id === dragSrcId);
      const dstIdx = todos.findIndex(t => t.id === todo.id);

      // splice로 소스 항목을 제거한 뒤 대상 위치에 삽입
      const [moved] = todos.splice(srcIdx, 1);
      todos.splice(dstIdx, 0, moved);

      saveTodos(todos);
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
// 공백만 입력된 경우 무시
function addTodo(text, priority) {
  const trimmed = text.trim();
  if (!trimmed) return;

  const todos = loadTodos();
  // id로 Date.now() 사용: 밀리초 타임스탬프로 고유성 보장
  todos.push({ id: Date.now(), text: trimmed, done: false, priority });
  saveTodos(todos);
  renderTodos();
}

// 특정 id의 todo 완료 상태를 반전
function toggleTodo(id) {
  const todos = loadTodos().map(t =>
    t.id === id ? { ...t, done: !t.done } : t
  );
  saveTodos(todos);
  renderTodos();
}

// 체크된(done) 항목 전체 일괄 삭제
function deleteCheckedTodos() {
  saveTodos(loadTodos().filter(t => !t.done));
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

// 페이지 로드 시 localStorage에 저장된 todos를 화면에 표시
renderTodos();
