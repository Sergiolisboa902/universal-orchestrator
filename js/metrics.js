// Lógica de Tempo e Métricas
async function openTaskDetails(task) {
    currentTask = task;
    document.getElementById('det-title').innerText = task.title;
    document.getElementById('det-desc').innerText = task.description || 'Sem descrição.';

    if (activeTimerInterval) clearInterval(activeTimerInterval);
    activeTaskId = task.id;
    activeTaskSeconds = task.time_spent || 0;
    
    document.getElementById('det-timer-display').innerText = formatTime(activeTaskSeconds);

    activeTimerInterval = setInterval(() => {
        activeTaskSeconds++;
        const d = document.getElementById('det-timer-display');
        if (d) d.innerText = formatTime(activeTaskSeconds);
        const mini = document.querySelector(`.task-card[ondragstart*="${activeTaskId}"] .task-timer-mini`);
        if (mini) mini.innerText = '⏱️ ' + formatTime(activeTaskSeconds);
    }, 1000);

    const { data } = await _supabase.from('subtasks').select('*').eq('task_id', task.id).order('created_at', { ascending: true });
    currentTask.subtasks = data || [];
    renderChecklist();
    openModal('task-details');
}

async function closeModal(type) {
    if (type === 'task-details' && activeTaskId) {
        clearInterval(activeTimerInterval);
        const finalTime = activeTaskSeconds;
        const taskId = activeTaskId;
        activeTaskId = null; activeTimerInterval = null;
        await _supabase.from('tasks').update({ time_spent: finalTime }).eq('id', taskId);
        await loadRoadmap();
    }
    const el = document.getElementById(`modal-${type}`);
    if (el) el.style.display = 'none';
}

function renderMetrics() {
    if (!currentProject) return;
    const done = allTasks.filter(t => t.status === 'done').length;
    const total = allTasks.length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    const active = allTasks.filter(t => t.status === 'doing').length;

    document.getElementById('metric-total-progress').innerText = percent + '%';
    document.getElementById('bar-total-progress').style.width = percent + '%';
    document.getElementById('metric-active-tasks').innerText = active;

    const categories = ['blueprint', 'business', 'design', 'front', 'back', 'infra', 'ia'];
    const container = document.getElementById('metrics-categories');
    if (container) {
        container.innerHTML = '';
        categories.forEach(cat => {
            const catTasks = allTasks.filter(t => t.category === cat);
            const catDone = catTasks.filter(t => t.status === 'done').length;
            const catTime = catTasks.reduce((acc, t) => acc + (t.time_spent || 0), 0);
            const catPercent = catTasks.length > 0 ? Math.round((catDone / catTasks.length) * 100) : 0;
            const div = document.createElement('div');
            div.className = 'category-metric';
            div.innerHTML = `<div style="display:flex; justify-content:space-between; margin-bottom:5px"><span style="text-transform:capitalize; font-weight:600">${cat}</span><span>${catPercent}%</span></div><div class="metric-chart-bar mini" style="margin-bottom:8px"><div style="width: ${catPercent}%"></div></div><div style="font-size:9px; color:var(--text2); font-family:var(--mono)">⏱️ Total: ${formatTime(catTime)}</div>`;
            container.appendChild(div);
        });
    }
}
