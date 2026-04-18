// Configuração Interna Segura (v12.1.8)
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
    if (!seconds && seconds !== 0) return "00:00:00";
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
        document.getElementById('loading-overlay').innerHTML = `<div style="text-align:center; padding: 20px;"><h2 style="color:var(--red)">Erro Crítico</h2><p>${e.message}</p></div>`;
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
    const { data: tasks, error } = await _supabase.from('tasks').select('*, subtasks(*)').eq('project_id', currentProject.id).order('created_at', { ascending: true });
    if (error) return;
    allTasks = tasks || [];
    const lists = { todo: document.getElementById('list-todo'), doing: document.getElementById('list-doing'), done: document.getElementById('list-done') };
    Object.values(lists).forEach(l => l.innerHTML = '');
    
    allTasks.forEach(t => {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.draggable = true;
        card.ondragstart = (e) => handleDragStart(e, t.id);
        card.onclick = (e) => { if (e.target.tagName !== 'BUTTON') openTaskDetails(t); };
        
        const subtasks = t.subtasks || [];
        const completed = subtasks.filter(i => i.done).length;
        const total = subtasks.length;
        const percent = total > 0 ? Math.round((completed / total) * 100) : 0;
        const timeSpent = t.time_spent || 0;
        const isThisActive = activeTaskId === t.id;

        card.innerHTML = `
            <span class="category-tag tag-${t.category || 'default'}">${t.category || 'Geral'}</span>
            <span class="task-title">${t.title}</span>
            <div class="task-timer-mini ${isThisActive ? 'timer-active' : ''}">⏱️ ${formatTime(isThisActive ? activeTaskSeconds : timeSpent)}</div>
            ${total > 0 ? `<div class="progress-container"><div class="progress-bar" style="width: ${percent}%"></div></div>` : ''}
        `;
        lists[t.status].appendChild(card);
    });
    updateAIContext();
}

async function openTaskDetails(task) {
    currentTask = task;
    document.getElementById('det-title').innerText = task.title;
    document.getElementById('det-desc').innerText = task.description || 'Sem descrição.';

    // Inicia Timer Automático
    if (activeTimerInterval) clearInterval(activeTimerInterval);
    activeTaskId = task.id;
    activeTaskSeconds = task.time_spent || 0;

    document.getElementById('det-timer-display').innerText = formatTime(activeTaskSeconds);
    document.getElementById('det-timer-btn').innerText = '⏸️';

    activeTimerInterval = setInterval(() => {
        activeTaskSeconds++;
        const display = document.getElementById('det-timer-display');
        if (display) display.innerText = formatTime(activeTaskSeconds);
        const mini = document.querySelector(`.task-card[ondragstart*="${activeTaskId}"] .task-timer-mini`);
        if (mini) {
            mini.innerText = '⏱️ ' + formatTime(activeTaskSeconds);
            mini.classList.add('timer-active');
        }
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
        activeTaskId = null;
        activeTimerInterval = null;
        await _supabase.from('tasks').update({ time_spent: finalTime }).eq('id', taskId);
        await loadRoadmap();
    }
    document.getElementById(`modal-${type}`).style.display = 'none'; 
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
    openTaskDetails(currentTask);
}

async function toggleSubtask(id, currentStatus) {
    await _supabase.from('subtasks').update({ done: !currentStatus }).eq('id', id);
    const { data } = await _supabase.from('subtasks').select('*').eq('task_id', currentTask.id).order('created_at', { ascending: true });
    currentTask.subtasks = data || [];
    renderChecklist();
}

async function deleteCurrentTask() {
    if (!confirm('Excluir?')) return;
    await _supabase.from('tasks').delete().eq('id', currentTask.id);
    closeModal('task-details');
    loadRoadmap();
}

function updateAIContext() {
    if (!currentProject) return;
    const val = (id) => document.getElementById(id)?.value || '';
    const contextText = `# PROJETO: ${currentProject.name}\n- STACK: ${val('t-front')} + ${val('t-back')}\n- PROGRESSO: ${allTasks.filter(t=>t.status==='done').length}/${allTasks.length} tarefas.`;
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
    document.getElementById('metric-active-tasks').innerText = allTasks.filter(t => t.status === 'doing').length;

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

// UX ENGINEERING & ASSETS
async function handleUXUpload(input) {
    const file = input.files[0];
    if (!file) return;
    
    const reader = new FileReader();
    reader.onload = async (e) => {
        const base64 = e.target.result;
        let currentRefs = [];
        try {
            currentRefs = JSON.parse(document.getElementById('f-visual-refs').value || '[]');
        } catch(e) {}
        
        currentRefs.push({ id: Date.now(), data: base64 });
        document.getElementById('f-visual-refs').value = JSON.stringify(currentRefs);
        renderUXGallery();
        saveBlueprint();
    };
    reader.readAsDataURL(file);
}

function renderUXGallery() {
    const gallery = document.getElementById('ux-gallery');
    if (!gallery) return;
    let refs = [];
    try {
        refs = JSON.parse(document.getElementById('f-visual-refs').value || '[]');
    } catch(e) {}
    
    gallery.innerHTML = refs.map(img => `
        <div class="ux-img-container">
            <img src="${img.data}" onclick="window.open('${img.data}')">
            <button class="ux-img-remove" onclick="removeUXImage(${img.id})">&times;</button>
        </div>
    `).join('');
}

function removeUXImage(id) {
    let refs = JSON.parse(document.getElementById('f-visual-refs').value || '[]');
    refs = refs.filter(r => r.id !== id);
    document.getElementById('f-visual-refs').value = JSON.stringify(refs);
    renderUXGallery();
    saveBlueprint();
}

function generateDesignTokens() {
    const get = (id) => document.getElementById(id).value;
    const css = `
:root {
  /* Colors */
  --primary: ${get('f-color-primary')};
  --secondary: ${get('f-color-secondary')};
  --accent: ${get('f-color-accent')};
  --success: ${get('f-color-success')};
  --error: ${get('f-color-error')};
  
  /* Geometry */
  --radius: ${get('f-ui-radius') || '8px'};
  --spacing: ${get('f-ui-spacing') || '8px'};
  
  /* Typography */
  --font-head: '${get('f-font-head') || 'Inter'}', sans-serif;
  --font-body: '${get('f-font-body') || 'Roboto'}', sans-serif;
}
    `.trim();
    navigator.clipboard.writeText(css);
    alert('Design Tokens (CSS) copiados para o clipboard!');
}

function fillBlueprintFields(p) {
    const f = {
        'f-nome': p.name, 'f-desc': p.description, 'f-goal': p.goal, 'f-instructions': p.ai_instructions,
        'f-bmc-partners': p.bmc_partners, 'f-bmc-activities': p.bmc_activities, 'f-bmc-resources': p.bmc_resources,
        'f-value': p.value_proposition, 'f-bmc-relationships': p.bmc_relationships, 'f-bmc-channels': p.bmc_channels,
        'f-bmc-segments': p.bmc_segments, 'f-bmc-costs': p.bmc_costs, 'f-revenue': p.revenue_sources, 'f-metrics': p.metrics_north,
        'f-color-primary': p.color_primary || '#6d58ff', 'f-color-secondary': p.color_secondary || '#1a1a1e',
        'f-color-accent': p.color_accent || '#9e8fff', 'f-color-success': p.color_success || '#2ecc71',
        'f-color-error': p.color_error || '#e74c3c', 'f-ui-radius': p.ui_radius, 'f-ui-spacing': p.ui_spacing,
        'f-font-head': p.font_head, 'f-font-body': p.font_body, 'f-font-scale': p.font_scale,
        'f-journey': p.user_journey, 'f-behavior': p.behavior_rules, 'f-ui-feedback': p.ui_feedback,
        'f-visual-refs': p.visual_refs, 'f-screen-map': p.screen_map,
        't-front': p.frontend_stack, 't-back': p.tech_backend, 't-style': p.style_stack, 't-auth': p.tech_auth, 't-apis': p.tech_apis,
        'f-schema': p.db_schema, 'f-db-policies': p.db_policies,
        'f-git': p.github_url, 'f-supabase': p.supabase_config, 'f-vercel': p.vercel_url,
        'f-mvp': p.mvp_scope, 'f-roadmap-v2': p.roadmap_v2
    };
    for (let id in f) { const el = document.getElementById(id); if (el) el.value = f[id] || ''; }
    renderUXGallery();
}

async function saveBlueprint() {
    if (!currentProject) return;
    const s = document.getElementById('sync-status');
    const data = {
        name: document.getElementById('f-nome').value,
        description: document.getElementById('f-desc').value,
        goal: document.getElementById('f-goal').value,
        ai_instructions: document.getElementById('f-instructions').value,
        bmc_partners: document.getElementById('f-bmc-partners').value,
        bmc_activities: document.getElementById('f-bmc-activities').value,
        bmc_resources: document.getElementById('f-bmc-resources').value,
        value_proposition: document.getElementById('f-value').value,
        bmc_relationships: document.getElementById('f-bmc-relationships').value,
        bmc_channels: document.getElementById('f-bmc-channels').value,
        bmc_segments: document.getElementById('f-bmc-segments').value,
        bmc_costs: document.getElementById('f-bmc-costs').value,
        revenue_sources: document.getElementById('f-revenue').value,
        metrics_north: document.getElementById('f-metrics').value,
        color_primary: document.getElementById('f-color-primary').value,
        color_secondary: document.getElementById('f-color-secondary').value,
        color_accent: document.getElementById('f-color-accent').value,
        color_success: document.getElementById('f-color-success').value,
        color_error: document.getElementById('f-color-error').value,
        ui_radius: document.getElementById('f-ui-radius').value,
        ui_spacing: document.getElementById('f-ui-spacing').value,
        font_head: document.getElementById('f-font-head').value,
        font_body: document.getElementById('f-font-body').value,
        font_scale: document.getElementById('f-font-scale').value,
        user_journey: document.getElementById('f-journey').value,
        behavior_rules: document.getElementById('f-behavior').value,
        ui_feedback: document.getElementById('f-ui-feedback').value,
        visual_refs: document.getElementById('f-visual-refs').value,
        screen_map: document.getElementById('f-screen-map').value,
        frontend_stack: document.getElementById('t-front').value,
        tech_backend: document.getElementById('t-back').value,
        style_stack: document.getElementById('t-style').value,
        tech_auth: document.getElementById('t-auth').value,
        tech_apis: document.getElementById('t-apis').value,
        db_schema: document.getElementById('f-schema').value,
        db_policies: document.getElementById('f-db-policies').value,
        github_url: document.getElementById('f-git').value,
        supabase_config: document.getElementById('f-supabase').value,
        vercel_url: document.getElementById('f-vercel').value,
        mvp_scope: document.getElementById('f-mvp').value,
        roadmap_v2: document.getElementById('f-roadmap-v2').value
    };
    try {
        await _supabase.from('projects').update(data).eq('id', currentProject.id);
        if (s) { s.innerText = "✅ Sincronizado"; s.style.color = "var(--green)"; }
        updateAIContext();
    } catch (e) { if (s) s.innerText = "❌ Erro"; }
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

document.addEventListener('DOMContentLoaded', init);
