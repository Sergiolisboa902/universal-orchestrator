// Universal Orchestrator - Core Bundle v13.1.3

// 1. CONFIG & STATE
const CONFIG = {
    SUPABASE_URL: "https://rppctxuvncoqfgjbfczo.supabase.co",
    SUPABASE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwcGN0eHV2bmNvcWZnamJmY3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NjU3ODQsImV4cCI6MjA5MTQ0MTc4NH0.OAzfJCLB7x3VpmRYBis4bvbseCDrfcVtZ6ZuBAjqIr4"
};
const _supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);

let currentProject = null;
let allTasks = [];
let allProjects = [];
let currentTask = null;
let saveTimeout = null;
let currentSlide = 0;
let activeTimerInterval = null;
let activeTaskId = null;
let activeTaskSeconds = 0;

function formatTime(s) {
    if (!s && s !== 0) return "00:00:00";
    const h = Math.floor(s / 3600);
    const m = Math.floor((s % 3600) / 60);
    const sec = s % 60;
    return [h, m, sec].map(v => v < 10 ? "0" + v : v).join(":");
}

// 2. PROJECTS LOGIC
async function loadProjects() {
    try {
        const { data, error } = await _supabase.from('projects').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        allProjects = data || [];
        renderProjectGrid();
    } catch (e) { console.error("Erro loadProjects:", e); }
}

function renderProjectGrid() {
    const grid = document.getElementById('project-grid');
    if (!grid) return;
    grid.innerHTML = '';
    allProjects.forEach(p => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
            <button class="btn-delete-project" onclick="deleteProject(event, '${p.id}')">Excluir</button>
            <div onclick="selectProjectById('${p.id}')" style="display:flex; align-items:center; gap:1.2rem; width:100%">
                <div class="project-card-icon">📁</div>
                <div class="project-card-info">
                    <h3 style="margin:0">${p.name}</h3>
                    <p style="margin:0; opacity:0.6">${p.status || 'Ativo'}</p>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function selectProjectById(id) {
    const project = allProjects.find(p => p.id === id);
    if (project) selectProject(project);
}

async function deleteProject(event, id) {
    event.stopPropagation();
    if (!confirm('Excluir projeto?')) return;
    await _supabase.from('tasks').delete().eq('project_id', id);
    await _supabase.from('projects').delete().eq('id', id);
    loadProjects();
}

async function createProject() {
    const name = document.getElementById('new-project-name').value;
    const basePath = document.getElementById('new-project-path').value;
    const gitUrl = document.getElementById('new-project-git').value;
    if (!name) return alert('Nome obrigatorio');
    
    const { data, error } = await _supabase.from('projects').insert([{ name, status: 'active', github_url: gitUrl }]).select();
    if (error) return alert(error.message);
    
    await injectFoundationalTasks(data[0].id);
    try {
        fetch('http://localhost:3000/provision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectName: name, basePath, gitUrl })
        });
    } catch (e) {}
    closeModal('project');
    await loadProjects();
    selectProject(data[0]);
}

async function injectFoundationalTasks(projectId) {
    const epics = [
        { project_id: projectId, category: 'blueprint', title: '🎯 1. Preencher Fundamentos', status: 'todo' },
        { project_id: projectId, category: 'design', title: '🧠 8. Experience Logic', status: 'todo' }
    ];
    await _supabase.from('tasks').insert(epics);
}

// 3. KANBAN & TIMER
async function loadRoadmap() {
    const { data } = await _supabase.from('tasks').select('*, subtasks(*)').eq('project_id', currentProject.id).order('created_at', { ascending: true });
    allTasks = data || [];
    const lists = { todo: document.getElementById('list-todo'), doing: document.getElementById('list-doing'), done: document.getElementById('list-done') };
    Object.values(lists).forEach(l => l.innerHTML = '');
    allTasks.forEach(t => {
        const isThisActive = activeTaskId === t.id;
        const card = document.createElement('div');
        card.className = 'task-card';
        card.draggable = true;
        card.ondragstart = (e) => handleDragStart(e, t.id);
        card.onclick = (e) => { if (e.target.tagName !== 'BUTTON') openTaskDetails(t); };
        card.innerHTML = `
            <span class="category-tag tag-${t.category || 'default'}">${t.category || 'Geral'}</span>
            <span class="task-title">${t.title}</span>
            <div class="task-timer-mini ${isThisActive ? 'timer-active' : ''}">⏱️ ${formatTime(isThisActive ? activeTaskSeconds : (t.time_spent || 0))}</div>
        `;
        lists[t.status].appendChild(card);
    });
    updateAIContext();
}

async function openTaskDetails(task) {
    currentTask = task;
    document.getElementById('det-title').innerText = task.title;
    document.getElementById('det-desc').innerText = task.description || 'Sem descrição.';
    if (activeTimerInterval) clearInterval(activeTimerInterval);
    activeTaskId = task.id;
    activeTaskSeconds = task.time_spent || 0;
    activeTimerInterval = setInterval(() => {
        activeTaskSeconds++;
        const d = document.getElementById('det-timer-display');
        if (d) d.innerText = formatTime(activeTaskSeconds);
        const mini = document.querySelector(`.task-card[ondragstart*="${activeTaskId}"] .task-timer-mini`);
        if (mini) mini.innerText = '⏱️ ' + formatTime(activeTaskSeconds);
    }, 1000);
    const { data } = await _supabase.from('subtasks').select('*').eq('task_id', task.id);
    currentTask.subtasks = data || [];
    renderChecklist();
    openModal('task-details');
}

async function closeModal(type) {
    if (type === 'task-details' && activeTaskId) {
        clearInterval(activeTimerInterval);
        await _supabase.from('tasks').update({ time_spent: activeTaskSeconds }).eq('id', activeTaskId);
        activeTaskId = null; activeTimerInterval = null;
        loadRoadmap();
    }
    const el = document.getElementById(`modal-${type}`);
    if (el) el.style.display = 'none';
}

function renderChecklist() {
    const container = document.getElementById('checklist-container');
    if (!container) return;
    container.innerHTML = (currentTask.subtasks || []).map(item => `
        <div class="checklist-item ${item.done ? 'done' : ''}">
            <div class="subtask-text">${item.text}</div>
            <input type="checkbox" ${item.done ? 'checked' : ''} onchange="toggleSubtask('${item.id}', ${item.done})">
        </div>
    `).join('');
}

// 4. UI & UTILS
function switchMainTab(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + id)?.classList.add('active');
    document.getElementById('tab-' + id)?.classList.add('active');
    if (id === 'metrics') renderMetrics();
    if (id === 'sync') updateAIContext();
}

function switchBP(n) {
    document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.bp-nav-item').forEach(i => i.classList.remove('active'));
    document.getElementById('bp-' + n)?.classList.add('active');
    document.querySelectorAll('.bp-nav-item')[n]?.classList.add('active');
}

function renderMetrics() {
    if (!currentProject) return;
    const done = allTasks.filter(t => t.status === 'done').length;
    const percent = allTasks.length > 0 ? Math.round((done / allTasks.length) * 100) : 0;
    document.getElementById('metric-total-progress').innerText = percent + '%';
    document.getElementById('bar-total-progress').style.width = percent + '%';
    
    const categories = ['blueprint', 'business', 'design', 'front', 'back', 'infra', 'ia'];
    const container = document.getElementById('metrics-categories');
    if (container) {
        container.innerHTML = categories.map(cat => {
            const catTasks = allTasks.filter(t => t.category === cat);
            const catTime = catTasks.reduce((acc, t) => acc + (t.time_spent || 0), 0);
            return `<div class="category-metric"><strong>${cat}</strong><div>⏱️ ${formatTime(catTime)}</div></div>`;
        }).join('');
    }
}

function updateAIContext() {
    const codeEl = document.getElementById('sync-code');
    if (codeEl && currentProject) codeEl.innerText = `# PROJETO: ${currentProject.name}`;
}

async function saveBlueprint() {
    if (!currentProject) return;
    const val = (id) => document.getElementById(id)?.value || '';
    const data = { name: val('f-nome'), description: val('f-desc'), goal: val('f-goal') };
    await _supabase.from('projects').update(data).eq('id', currentProject.id);
    document.getElementById('sync-status').innerText = "✅ Sincronizado";
}

function triggerAutoSave() {
    document.getElementById('sync-status').innerText = "⏳ Alterando...";
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveBlueprint, 1500);
}

function openModal(type, targetStatus = 'todo') {
    document.getElementById(`modal-${type}`).style.display = 'flex';
    if (type === 'task') document.getElementById('task-status-target').value = targetStatus;
}

function handleDragStart(e, taskId) { e.dataTransfer.setData('text/plain', taskId); }
function handleDragOver(e) { e.preventDefault(); }
async function handleDrop(e, targetStatus) {
    const taskId = e.dataTransfer.getData('text/plain');
    await _supabase.from('tasks').update({ status: targetStatus }).eq('id', taskId);
    loadRoadmap();
}

function copySync() { navigator.clipboard.writeText(document.getElementById('sync-code').innerText); alert('Copiado!'); }
function selectProject(p) { currentProject = p; document.getElementById('project-title-display').innerText = p.name; document.getElementById('view-projects').style.display = 'none'; document.getElementById('view-dashboard').style.display = 'flex'; loadRoadmap(); }
