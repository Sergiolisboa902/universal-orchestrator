// Universal Orchestrator - Timer & Task Details Logic

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
    if (typeof renderChecklist === 'function') renderChecklist();
    openModal('task-details');
}

/**
 * Versão estendida de closeModal para lidar com o cronômetro
 */
async function closeModal(type) {
    if (type === 'task-details' && activeTaskId) {
        clearInterval(activeTimerInterval);
        const finalTime = activeTaskSeconds;
        const taskId = activeTaskId;
        activeTaskId = null; activeTimerInterval = null;
        await _supabase.from('tasks').update({ time_spent: finalTime }).eq('id', taskId);
        if (typeof loadRoadmap === 'function') await loadRoadmap();
    }
    const el = document.getElementById(`modal-${type}`);
    if (el) el.style.display = 'none';
}
