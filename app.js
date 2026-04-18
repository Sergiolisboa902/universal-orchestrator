// Configuração Interna Segura (v12.1.2)
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

async function init() {
    console.log("🚀 Inicializando Orquestrador...");
    try {
        // Inicializa Supabase diretamente do CONFIG interno
        _supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
        console.log("✅ Supabase conectado.");

        // Carrega projetos
        await loadProjects();
        
        // Esconde o overlay
        document.getElementById('loading-overlay').style.display = 'none';
        console.log("✨ Sistema pronto.");
        
        // Se houver um projeto salvo na sessão, seleciona ele
        const lastId = localStorage.getItem('currentProjectId');
        if (lastId) {
            selectProjectById(lastId);
        } else {
            backToProjects();
        }
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

// GESTÃO DE PROJETOS
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
    if (!name) return alert('Digite o nome');
    const { data, error } = await _supabase.from('projects').insert([{ name, status: 'active' }]).select();
    if (error) return alert('Erro: ' + error.message);
    const newProject = data[0];
    await injectFoundationalTasks(newProject.id);
    closeModal('project');
    await loadProjects();
    selectProject(newProject);
}

async function injectFoundationalTasks(projectId) {
    const epics = [
        { project_id: projectId, category: 'blueprint', title: '🎯 1. Preencher Fundamentos', description: 'Problema, Missão, Visão e Regras de Ouro.', status: 'todo' },
        { project_id: projectId, category: 'business', title: '💼 2. Business Model Canvas', description: 'Mapear os 9 blocos do modelo de negócio.', status: 'todo' },
        { project_id: projectId, category: 'design', title: '🎨 3. UX & Identidade Visual', description: 'Design System, Jornada e Mapa de Telas.', status: 'todo' },
        { project_id: projectId, category: 'back', title: '⚙️ 4. Definir Stack & Arquitetura', description: 'Front, Back, Auth e APIs.', status: 'todo' },
        { project_id: projectId, category: 'back', title: '💾 5. Modelagem de Dados', description: 'Schema SQL e Políticas de Segurança (RLS).', status: 'todo' },
        { project_id: projectId, category: 'infra', title: '🏗️ 6. Setup Infra & DevOps', description: 'Git, Supabase, Vercel e Environments.', status: 'todo' },
        { project_id: projectId, category: 'blueprint', title: '🚀 7. Definir Escopo MVP', description: 'Funcionalidades críticas para v1.0.', status: 'todo' }
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
    renderProjectGrid(); // Apenas renderiza o que já está na memória
}

// GESTÃO DE TAREFAS
async function createTask() {
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-desc').value;
    const category = document.getElementById('task-category').value;
    const status = document.getElementById('task-status-target').value;
    if (!title) return alert('Digite o título');
    const newTask = { project_id: currentProject.id, title, description, category, status };
    await _supabase.from('tasks').insert([newTask]);
    closeModal('task');
    loadRoadmap();
}

async function loadRoadmap() {
    const { data: tasks, error } = await _supabase.from('tasks').select('*, subtasks(*)').eq('project_id', currentProject.id).order('created_at', { ascending: true });
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
        card.innerHTML = `
            <span class="category-tag tag-${t.category || 'default'}">${t.category || 'Geral'}</span>
            <span class="task-title">${t.title}</span>
            <p class="task-desc">${t.description || ''}</p>
            ${total > 0 ? `<div class="progress-container"><div class="progress-bar" style="width: ${percent}%"></div></div><span class="progress-text">${completed}/${total} (${percent}%)</span>` : ''}
        `;
        lists[t.status].appendChild(card);
    });
    updateAIContext();
}

async function handleDrop(e, targetStatus) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');
    const taskId = e.dataTransfer.getData('text/plain');
    await _supabase.from('tasks').update({ status: targetStatus }).eq('id', taskId);
    if (targetStatus === 'done') await _supabase.from('subtasks').update({ done: true }).eq('task_id', taskId);
    loadRoadmap();
}

function handleDragStart(e, taskId) { e.dataTransfer.setData('text/plain', taskId); e.target.classList.add('dragging'); }
function handleDragOver(e) { e.preventDefault(); e.currentTarget.classList.add('drag-over'); }
function handleDragLeave(e) { e.currentTarget.classList.remove('drag-over'); }

async function openTaskDetails(task) {
    currentTask = task;
    document.getElementById('det-title').innerText = task.title;
    document.getElementById('det-desc').innerText = task.description || 'Sem descrição.';
    document.getElementById('det-category').innerText = task.category || 'Geral';
    document.getElementById('det-category').className = `category-tag tag-${task.category || 'default'}`;
    const { data } = await _supabase.from('subtasks').select('*').eq('task_id', task.id).order('created_at', { ascending: true });
    currentTask.subtasks = data || [];
    renderChecklist();
    openModal('task-details');
}

function renderChecklist() {
    const container = document.getElementById('checklist-container');
    container.innerHTML = '';
    (currentTask.subtasks || []).forEach((item, index) => {
        const div = document.createElement('div');
        div.className = `checklist-item ${item.done ? 'done' : ''}`;
        div.innerHTML = `<div class="subtask-text">${item.text}</div><div class="subtask-actions"><input type="checkbox" ${item.done ? 'checked' : ''} onchange="toggleSubtask('${item.id}', ${item.done})"><button class="btn-del-sub" onclick="removeSubtask('${item.id}')">🗑️</button></div>`;
        container.appendChild(div);
    });
    const completed = (currentTask.subtasks || []).filter(i => i.done).length;
    const total = (currentTask.subtasks || []).length;
    document.getElementById('det-progress').innerText = total > 0 ? Math.round((completed / total) * 100) + '%' : '0%';
}

async function addSubtask() {
    const input = document.getElementById('new-subtask-name');
    const text = input.value.trim();
    if (!text) return;
    await _supabase.from('subtasks').insert([{ task_id: currentTask.id, text, done: false }]);
    input.value = '';
    openTaskDetails(currentTask);
    loadRoadmap();
}

async function toggleSubtask(id, currentStatus) {
    await _supabase.from('subtasks').update({ done: !currentStatus }).eq('id', id);
    openTaskDetails(currentTask);
    loadRoadmap();
}

async function removeSubtask(id) {
    await _supabase.from('subtasks').delete().eq('id', id);
    openTaskDetails(currentTask);
    loadRoadmap();
}

async function deleteCurrentTask() {
    if (!confirm('Excluir?')) return;
    await _supabase.from('tasks').delete().eq('id', currentTask.id);
    closeModal('task-details');
    loadRoadmap();
}

// MOTOR IA 3.0 (COMPLETO)
function updateAIContext() {
    if (!currentProject) return;
    const doing = allTasks.filter(t => t.status === 'doing');
    const val = (id) => document.getElementById(id)?.value || '';

    const contextText = `
# CONTEXTO ESTRATÉGICO DE ALTO NÍVEL
# PROJETO: ${currentProject.name}

## 🎯 1. FUNDAMENTOS
- PROBLEMA: ${val('f-desc')}
- MISSÃO: ${val('f-goal')}
- REGRAS DE OURO: ${val('f-instructions')}

## 💼 2. BUSINESS MODEL (BMC)
- VALOR: ${val('f-value')}
- SEGMENTOS: ${val('f-bmc-segments')}
- RECEITA: ${val('f-revenue')}
- PARCEIROS: ${val('f-bmc-partners')}

## 🎨 3. UX & DESIGN
- BRANDING: ${val('f-branding')}
- TELAS: ${val('f-screen-map')}

## ⚙️ 4. STACK TÉCNICA
- FRONT: ${val('t-front')} | BACK: ${val('t-back')}
- AUTH: ${val('t-auth')} | APIs: ${val('t-apis')}

## 💾 5. DADOS & SEGURANÇA
${val('f-schema')}
- RLS/POLICIES: ${val('f-db-policies')}

## 🏗️ 6. INFRA
- REPO: ${val('f-git')} | PROD: ${val('f-vercel')}

## 🚀 7. MVP SCOPE
- CRÍTICO: ${val('f-mvp')}

## 🔄 ESTADO ATUAL
- EM FOCO: ${doing.map(t => `[${t.title}]`).join(', ') || 'Nenhuma tarefa em andamento.'}
`.trim();

    const codeEl = document.getElementById('sync-code');
    if (codeEl) codeEl.innerText = contextText;
}

// PITCH DECK ENGINE
function renderPitchDeck() {
    const viewer = document.getElementById('slide-viewer');
    if (!viewer || !currentProject) return;
    const p = currentProject;
    const doneTasks = allTasks.filter(t => t.status === 'done').length;
    const totalTasks = allTasks.length;
    
    const slides = [
        `<h1>${p.name}</h1><h2>Missão</h2><p>${p.goal || 'Definindo o futuro.'}</p>`,
        `<h2>O Problema</h2><p>${p.description || 'Não definido.'}</p>`,
        `<h2>A Solução</h2><p>${p.value_proposition || 'Não definido.'}</p>`,
        `<h2>Modelo de Negócio</h2><p><b>Receita:</b> ${p.revenue_sources || 'Não definido'}<br><b>Custos:</b> ${p.bmc_costs || 'Não definido'}</p>`,
        `<h2>Stack Tecnológica</h2><p>${p.frontend_stack || 'N/A'} + ${p.tech_backend || 'N/A'}<br>Segurança via ${p.tech_auth || 'Supabase Auth'}</p>`,
        `<h2>Status do Projeto</h2><h1>${totalTasks > 0 ? Math.round((doneTasks/totalTasks)*100) : 0}%</h1><p>${doneTasks} de ${totalTasks} etapas concluídas.</p>`
    ];

    viewer.innerHTML = slides.map((content, i) => `<div class="slide ${i === currentSlide ? 'active' : ''}">${content}</div>`).join('');
    document.getElementById('slide-number').innerText = `${currentSlide + 1} / ${slides.length}`;
}

function nextSlide() { if (currentSlide < 5) { currentSlide++; renderPitchDeck(); } }
function prevSlide() { if (currentSlide > 0) { currentSlide--; renderPitchDeck(); } }

// DASHBOARD & MÉTRICAS
function renderMetrics() {
    if (!currentProject) return;
    const done = allTasks.filter(t => t.status === 'done').length;
    const total = allTasks.length;
    const active = allTasks.filter(t => t.status === 'doing').length;
    const percent = total > 0 ? Math.round((done / total) * 100) : 0;

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
            const catPercent = catTasks.length > 0 ? Math.round((catDone / catTasks.length) * 100) : 0;
            const div = document.createElement('div');
            div.className = 'category-metric';
            div.innerHTML = `
                <div style="display:flex; justify-content:space-between; margin-bottom:5px">
                    <span style="text-transform:capitalize">${cat}</span>
                    <span>${catPercent}%</span>
                </div>
                <div class="metric-chart-bar mini"><div style="width: ${catPercent}%"></div></div>
            `;
            container.appendChild(div);
        });
    }
}

// EXPORTAÇÃO
function exportBlueprintMarkdown() {
    if (!currentProject) return;
    const val = (id) => document.getElementById(id)?.value || '';
    const md = `
# BLUEPRINT 360: ${currentProject.name}
Gerado por Universal Orchestrator

## 🎯 1. FUNDAMENTOS
- **Problema:** ${val('f-desc')}
- **Missão:** ${val('f-goal')}
- **Regras:** ${val('f-instructions')}

## 💼 2. BUSINESS CANVAS
- **Valor:** ${val('f-value')}
- **Segmentos:** ${val('f-bmc-segments')}
- **Receita:** ${val('f-revenue')}

## ⚙️ 3. STACK TÉCNICA
- **Front:** ${val('t-front')}
- **Back:** ${val('t-back')}
- **Auth:** ${val('t-auth')}

## 💾 4. DADOS
\`\`\`sql
${val('f-schema')}
\`\`\`

## 🚀 5. MVP
- **Escopo:** ${val('f-mvp')}
`.trim();

    const blob = new Blob([md], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `blueprint-${currentProject.name.toLowerCase().replace(/\s+/g, '-')}.md`;
    a.click();
}

// MOTOR IA REFINADO
function generateSpecificPrompt() {
    const mode = document.getElementById('prompt-mode').value;
    const baseContext = document.getElementById('sync-code').innerText;
    let specificInstruction = "";
    switch(mode) {
        case 'code':
            specificInstruction = "\n\n--- INSTRUÇÃO DE CÓDIGO ---\nAtue como um Senior Fullstack Developer. Com base no contexto acima, gere o código necessário para a funcionalidade que solicitarei a seguir. Siga rigorosamente a Stack Técnica e o Schema SQL definidos.";
            break;
        case 'business':
            specificInstruction = "\n\n--- INSTRUÇÃO DE NEGÓCIOS ---\nAtue como um Especialista em Product Management & Venture Capital. Analise o contexto acima e sugira melhorias no modelo de monetização ou na proposta de valor.";
            break;
        case 'debug':
            specificInstruction = "\n\n--- INSTRUÇÃO DE DEBUG ---\nAnalise o contexto técnico acima. Vou descrever um erro que está ocorrendo e você deve identificar a causa raiz com base no Schema e na Stack informada.";
            break;
        default:
            specificInstruction = "\n\n--- INSTRUÇÃO ESTRATÉGICA ---\nConsidere todo o contexto acima como a 'Única Fonte da Verdade' do projeto.";
    }
    navigator.clipboard.writeText(baseContext + specificInstruction);
    alert('Prompt Gerado e Copiado para o modo: ' + mode);
}

// UI UTILS
function switchMainTab(id) {
    localStorage.setItem('currentTab', id);
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    document.getElementById('tab-' + id).classList.add('active');
    if (id === 'pitch') { currentSlide = 0; renderPitchDeck(); }
    if (id === 'sync') { updateAIContext(); }
    if (id === 'metrics') { renderMetrics(); }
}

function switchBP(n) {
    document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.bp-nav-item').forEach(i => i.classList.remove('active'));
    document.getElementById('bp-' + n).classList.add('active');
    document.querySelectorAll('.bp-nav-item')[n].classList.add('active');
}

// AUTOSAVE & SYNC
function fillBlueprintFields(p) {
    const f = {
        'f-nome': p.name, 'f-desc': p.description, 'f-goal': p.goal, 'f-instructions': p.ai_instructions,
        'f-bmc-partners': p.bmc_partners, 'f-bmc-activities': p.bmc_activities, 'f-bmc-resources': p.bmc_resources,
        'f-value': p.value_proposition, 'f-bmc-relationships': p.bmc_relationships, 'f-bmc-channels': p.bmc_channels,
        'f-bmc-segments': p.bmc_segments, 'f-bmc-costs': p.bmc_costs, 'f-revenue': p.revenue_sources, 'f-metrics': p.metrics_north,
        'f-branding': p.branding_colors, 'f-screen-map': p.screen_map, 'f-journey': p.user_journey,
        't-front': p.frontend_stack, 't-back': p.tech_backend, 't-style': p.style_stack, 't-auth': p.tech_auth, 't-apis': p.tech_apis,
        'f-schema': p.db_schema, 'f-db-policies': p.db_policies,
        'f-git': p.github_url, 'f-supabase': p.supabase_config, 'f-vercel': p.vercel_url,
        'f-mvp': p.mvp_scope, 'f-roadmap-v2': p.roadmap_v2
    };
    for (let id in f) { const el = document.getElementById(id); if (el) el.value = f[id] || ''; }
}

function triggerAutoSave() {
    const s = document.getElementById('sync-status');
    if (s) { s.innerText = "⏳ Alterando..."; s.style.color = "var(--amber)"; }
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveBlueprint, 1500);
}

async function saveBlueprint() {
    if (!currentProject) return;
    const s = document.getElementById('sync-status');
    if (s) { s.innerText = "☁️ Salvando..."; }
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
        branding_colors: document.getElementById('f-branding').value,
        screen_map: document.getElementById('f-screen-map').value,
        user_journey: document.getElementById('f-journey').value,
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
    } catch (e) { if (s) { s.innerText = "❌ Erro"; s.style.color = "var(--red)"; } }
}

function openModal(type, targetStatus = 'todo') { 
    document.getElementById(`modal-${type}`).style.display = 'flex'; 
    if (type === 'task') { document.getElementById('task-status-target').value = targetStatus; }
}

function closeModal(type) { document.getElementById(`modal-${type}`).style.display = 'none'; }
function copySync() { navigator.clipboard.writeText(document.getElementById('sync-code').innerText); alert('Copiado!'); }

// Inicialização - v12.1.1 (Build 2026-04-18)
document.addEventListener('DOMContentLoaded', init);
