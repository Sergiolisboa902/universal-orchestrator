// Quadro Kanban e Tarefas
async function loadRoadmap() {
    const { data: tasks } = await _supabase.from('tasks').select('*, subtasks(*)').eq('project_id', currentProject.id).order('created_at', { ascending: true });
    allTasks = tasks || [];
    const lists = { todo: document.getElementById('list-todo'), doing: document.getElementById('list-doing'), done: document.getElementById('list-done') };
    Object.values(lists).forEach(l => l.innerHTML = '');

    allTasks.forEach(t => {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.draggable = true;
        card.ondragstart = (e) => handleDragStart(e, t.id);
        card.onclick = (e) => { if (e.target.tagName !== 'BUTTON' && e.target.tagName !== 'INPUT') openTaskDetails(t); };

        const subtasks = t.subtasks || [];
        const completed = subtasks.filter(i => i.done).length;
        const total = subtasks.length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        const isThisActive = activeTaskId === t.id;

        card.innerHTML = `
            <span class="category-tag tag-${t.category || 'default'}">${t.category || 'Geral'}</span>
            <span class="task-title">${t.title}</span>
            <div class="task-timer-mini ${isThisActive ? 'timer-active' : ''}">⏱️ ${formatTime(isThisActive ? activeTaskSeconds : (t.time_spent || 0))}</div>
            ${total > 0 ? `<div class="progress-container"><div class="progress-bar" style="width: ${percent}%"></div></div>` : ''}
        `;
        lists[t.status].appendChild(card);
    });
    updateAIContext();
}

async function createTask() {
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-desc').value;
    const category = document.getElementById('task-category').value;
    const status = document.getElementById('task-status-target').value;
    if (!title) return alert('Título obrigatório');
    await _supabase.from('tasks').insert([{ project_id: currentProject.id, title, description, category, status }]);
    closeModal('task');
    loadRoadmap();
}

async function deleteCurrentTask() {
    if (!confirm('Excluir tarefa?')) return;
    await _supabase.from('tasks').delete().eq('id', currentTask.id);
    closeModal('task-details');
    loadRoadmap();
}

function renderChecklist() {
    const container = document.getElementById('checklist-container');
    if (!container) return;
    container.innerHTML = '';
    (currentTask.subtasks || []).forEach(item => {
        const div = document.createElement('div');
        div.className = `checklist-item ${item.done ? 'done' : ''}`;
        div.innerHTML = `<div class="subtask-text">${item.text}</div><input type="checkbox" ${item.done ? 'checked' : ''} onchange="toggleSubtask('${item.id}', ${item.done})">`;
        container.appendChild(div);
    });
    const completed = (currentTask.subtasks || []).filter(i => i.done).length;
    const total = (currentTask.subtasks || []).length;
    const progressEl = document.getElementById('det-progress');
    if (progressEl) progressEl.innerText = total > 0 ? Math.round((completed / total) * 100) + '%' : '0%';
}

async function addSubtask() {
    const input = document.getElementById('new-subtask-name');
    if (!input || !input.value) return;
    await _supabase.from('subtasks').insert([{ task_id: currentTask.id, text: input.value, done: false }]);
    input.value = '';
    const { data } = await _supabase.from('subtasks').select('*').eq('task_id', currentTask.id).order('created_at', { ascending: true });
    currentTask.subtasks = data || [];
    renderChecklist();
    loadRoadmap();
}

async function toggleSubtask(id, currentStatus) {
    await _supabase.from('subtasks').update({ done: !currentStatus }).eq('id', id);
    const { data } = await _supabase.from('subtasks').select('*').eq('task_id', currentTask.id).order('created_at', { ascending: true });
    currentTask.subtasks = data || [];
    renderChecklist();
    loadRoadmap();
}

function handleDragStart(e, taskId) { e.dataTransfer.setData('text/plain', taskId); }
function handleDragOver(e) { e.preventDefault(); }
async function handleDrop(e, targetStatus) {
    const taskId = e.dataTransfer.getData('text/plain');
    await _supabase.from('tasks').update({ status: targetStatus }).eq('id', taskId);
    loadRoadmap();
}
