// Configuração Interna Segura (v12.1.4)
const CONFIG = {
    SUPABASE_URL: "https://rppctxuvncoqfgjbfczo.supabase.co",
    SUPABASE_KEY: "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwcGN0eHV2bmNvcWZnamJmY3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NjU3ODQsImV4cCI6MjA5MTQ0MTc4NH0.OAzfJCLB7x3VpmRYBis4bvbseCDrfcVtZ6ZuBAjqIr4"
};

let _supabase = null;
let currentProject = null;
let allTasks = [];
let allProjects = [];
let currentTask = null;
let saveTimeout = null;
let currentSlide = 0;

// Variáveis do Timer
let activeTimerInterval = null;
let activeTaskId = null;
let activeTaskSeconds = 0;

function formatTime(seconds) {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map(v => v < 10 ? "0" + v : v).join(":");
}

async function init() {
    console.log("🚀 Inicializando Orquestrador...");
    try {
        _supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
        await loadProjects();
        document.getElementById('loading-overlay').style.display = 'none';
        backToProjects();
    } catch (e) {
        console.error("❌ Erro na inicialização:", e);
        document.getElementById('loading-overlay').innerHTML = `
            <div style="text-align:center; padding: 20px;">
                <h2 style="color:var(--red)">Erro Crítico</h2>
                <p style="margin:10px 0">${e.message}</p>
                <button class="btn btn-primary" onclick="location.reload()">Tentar Novamente</button>
            </div>
        `;
    }
}

async function loadProjects() {
    const { data: projects, error } = await _supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    allProjects = projects || [];
    renderProjectGrid();
}

function renderProjectGrid() {
    const grid = document.getElementById('project-grid');
    if (!grid) return;
    grid.innerHTML = '';
    allProjects.forEach(p => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.innerHTML = `
            <button class="btn-delete-project" onclick="deleteProject(event, '${p.id}')">🗑️</button>
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
    if (!confirm('Excluir projeto e todas as tarefas?')) return;
    await _supabase.from('tasks').delete().eq('project_id', id);
    await _supabase.from('projects').delete().eq('id', id);
    await loadProjects();
}

async function createProject() {
    const name = document.getElementById('new-project-name').value;
    const basePath = document.getElementById('new-project-path').value;
    const gitUrl = document.getElementById('new-project-git').value;
    const vercelUrl = document.getElementById('new-project-vercel').value;
    const supabaseConf = document.getElementById('new-project-supabase').value;

    if (!name) return alert('Digite o nome');
    const projectData = { name, status: 'active', github_url: gitUrl, vercel_url: vercelUrl, supabase_config: supabaseConf };
    const { data, error } = await _supabase.from('projects').insert([projectData]).select();
    if (error) return alert('Erro: ' + error.message);
    const newProject = data[0];
    await injectFoundationalTasks(newProject.id);
    
    try {
        await fetch('http://localhost:3000/provision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectName: name, basePath, gitUrl, vercelUrl })
        });
    } catch (e) { console.warn("Provisionamento local offline."); }

    closeModal('project');
    await loadProjects();
    selectProject(newProject);
}

async function injectFoundationalTasks(projectId) {
    const epics = [
        { project_id: projectId, category: 'blueprint', title: '🎯 1. Preencher Fundamentos', status: 'todo' },
        { project_id: projectId, category: 'business', title: '💼 2. Business Model Canvas', status: 'todo' },
        { project_id: projectId, category: 'design', title: '🎨 3. UX & Identidade Visual', status: 'todo' },
        { project_id: projectId, category: 'back', title: '⚙️ 4. Definir Stack & Arquitetura', status: 'todo' },
        { project_id: projectId, category: 'back', title: '💾 5. Modelagem de Dados', status: 'todo' },
        { project_id: projectId, category: 'infra', title: '🏗️ 6. Setup Infra & DevOps', status: 'todo' },
        { project_id: projectId, category: 'blueprint', title: '🚀 7. Definir Escopo MVP', status: 'todo' }
    ];
    await _supabase.from('tasks').insert(epics);
}

function selectProject(project) {
    currentProject = project;
    localStorage.setItem('currentProjectId', project.id);
    document.getElementById('project-title-display').innerText = project.name;
    document.getElementById('view-projects').style.display = 'none';
    document.getElementById('view-dashboard').style.display = 'flex';
    switchMainTab('roadmap');
    fillBlueprintFields(project);
    loadRoadmap();
}

function backToProjects() {
    localStorage.removeItem('currentProjectId');
    document.getElementById('view-projects').style.display = 'flex';
    document.getElementById('view-dashboard').style.display = 'none';
    renderProjectGrid();
}

async function createTask() {
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-desc').value;
    const category = document.getElementById('task-category').value;
    const status = document.getElementById('task-status-target').value;
    if (!title) return alert('Digite o título');
    await _supabase.from('tasks').insert([{ project_id: currentProject.id, title, description, category, status }]);
    closeModal('task');
    loadRoadmap();
}

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
        card.onclick = (e) => { if (e.target.tagName !== 'BUTTON') openTaskDetails(t); };
        
        const timeSpent = t.time_spent || 0;
        const isThisActive = activeTaskId === t.id;

        card.innerHTML = `
            <span class="category-tag tag-${t.category || 'default'}">${t.category || 'Geral'}</span>
            <span class="task-title">${t.title}</span>
            <div class="task-timer-mini ${isThisActive ? 'timer-active' : ''}">⏱️ ${formatTime(isThisActive ? activeTaskSeconds : timeSpent)}</div>
        `;
        lists[t.status].appendChild(card);
    });
    updateAIContext();
}

async function toggleTimerFromModal() {
    if (!currentTask) return;
    if (activeTaskId === currentTask.id) {
        clearInterval(activeTimerInterval);
        await _supabase.from('tasks').update({ time_spent: activeTaskSeconds }).eq('id', activeTaskId);
        activeTaskId = null;
        activeTimerInterval = null;
        document.getElementById('det-timer-btn').innerText = '▶️';
    } else {
        if (activeTaskId) {
            clearInterval(activeTimerInterval);
            await _supabase.from('tasks').update({ time_spent: activeTaskSeconds }).eq('id', activeTaskId);
        }
        activeTaskId = currentTask.id;
        activeTaskSeconds = currentTask.time_spent || 0;
        document.getElementById('det-timer-btn').innerText = '⏸️';
        activeTimerInterval = setInterval(() => {
            activeTaskSeconds++;
            document.getElementById('det-timer-display').innerText = formatTime(activeTaskSeconds);
            const mini = document.querySelector(`.task-card[ondragstart*="${activeTaskId}"] .task-timer-mini`);
            if (mini) mini.innerText = '⏱️ ' + formatTime(activeTaskSeconds);
        }, 1000);
    }
}

async function openTaskDetails(task) {
    currentTask = task;
    document.getElementById('det-title').innerText = task.title;
    document.getElementById('det-desc').innerText = task.description || 'Sem descrição.';
    const isThisActive = activeTaskId === task.id;
    document.getElementById('det-timer-display').innerText = formatTime(isThisActive ? activeTaskSeconds : (task.time_spent || 0));
    document.getElementById('det-timer-btn').innerText = isThisActive ? '⏸️' : '▶️';

    const { data } = await _supabase.from('subtasks').select('*').eq('task_id', task.id).order('created_at', { ascending: true });
    currentTask.subtasks = data || [];
    renderChecklist();
    openModal('task-details');
}

function renderChecklist() {
    const container = document.getElementById('checklist-container');
    container.innerHTML = '';
    (currentTask.subtasks || []).forEach(item => {
        const div = document.createElement('div');
        div.className = `checklist-item ${item.done ? 'done' : ''}`;
        div.innerHTML = `<div class="subtask-text">${item.text}</div><input type="checkbox" ${item.done ? 'checked' : ''} onchange="toggleSubtask('${item.id}', ${item.done})">`;
        container.appendChild(div);
    });
}

async function addSubtask() {
    const input = document.getElementById('new-subtask-name');
    if (!input.value) return;
    await _supabase.from('subtasks').insert([{ task_id: currentTask.id, text: input.value, done: false }]);
    input.value = '';
    openTaskDetails(currentTask);
    loadRoadmap();
}

async function toggleSubtask(id, currentStatus) {
    await _supabase.from('subtasks').update({ done: !currentStatus }).eq('id', id);
    openTaskDetails(currentTask);
    loadRoadmap();
}

function updateAIContext() {
    if (!currentProject) return;
    const val = (id) => document.getElementById(id)?.value || '';
    const contextText = `# PROJETO: ${currentProject.name}\n## STATUS: ${allTasks.filter(t=>t.status==='done').length}/${allTasks.length} tarefas concluídas.`;
    const codeEl = document.getElementById('sync-code');
    if (codeEl) codeEl.innerText = contextText;
}

function renderMetrics() {
    if (!currentProject) return;
    const done = allTasks.filter(t => t.status === 'done').length;
    const total = allTasks.length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;
    document.getElementById('metric-total-progress').innerText = percent + '%';
    document.getElementById('bar-total-progress').style.width = percent + '%';
}

function switchMainTab(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    document.getElementById('tab-' + id).classList.add('active');
    if (id === 'metrics') renderMetrics();
    if (id === 'sync') updateAIContext();
}

function switchBP(n) {
    document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.bp-nav-item').forEach(i => i.classList.remove('active'));
    document.getElementById('bp-' + n).classList.add('active');
    document.querySelectorAll('.bp-nav-item')[n].classList.add('active');
}

function fillBlueprintFields(p) {
    const fields = { 'f-nome': p.name, 'f-desc': p.description, 'f-git': p.github_url, 'f-vercel': p.vercel_url };
    for (let id in fields) { const el = document.getElementById(id); if (el) el.value = fields[id] || ''; }
}

function triggerAutoSave() {
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveBlueprint, 1500);
}

async function saveBlueprint() {
    if (!currentProject) return;
    const data = { name: document.getElementById('f-nome').value, description: document.getElementById('f-desc').value };
    await _supabase.from('projects').update(data).eq('id', currentProject.id);
}

function openModal(type, targetStatus = 'todo') { 
    document.getElementById(`modal-${type}`).style.display = 'flex'; 
    if (type === 'task') document.getElementById('task-status-target').value = targetStatus;
}
function closeModal(type) { document.getElementById(`modal-${type}`).style.display = 'none'; }
function handleDragStart(e, taskId) { e.dataTransfer.setData('text/plain', taskId); }
function handleDragOver(e) { e.preventDefault(); }
async function handleDrop(e, targetStatus) {
    const taskId = e.dataTransfer.getData('text/plain');
    await _supabase.from('tasks').update({ status: targetStatus }).eq('id', taskId);
    loadRoadmap();
}

document.addEventListener('DOMContentLoaded', init);
