// Universal Orchestrator - UI Rendering Engine

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

function selectProject(project) {
    currentProject = project;
    document.getElementById('project-title-display').innerText = project.name;
    document.getElementById('view-projects').style.display = 'none';
    document.getElementById('view-dashboard').style.display = 'flex';
    switchMainTab('roadmap');
    fillBlueprintFields(project);
    loadRoadmap();
}

function backToProjects() {
    document.getElementById('view-projects').style.display = 'flex';
    document.getElementById('view-dashboard').style.display = 'none';
    renderProjectGrid();
}

function renderKanban() {
    const lists = { todo: document.getElementById('list-todo'), doing: document.getElementById('list-doing'), done: document.getElementById('list-done') };
    Object.values(lists).forEach(l => { if (l) l.innerHTML = ''; });

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
        if (lists[t.status]) lists[t.status].appendChild(card);
    });
    updateAIContext();
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

function updateAIContext() {
    if (!currentProject) return;
    const mode = document.getElementById('prompt-mode')?.value || 'strategic';
    
    let contextText = `# PROJETO: ${currentProject.name}\n`;
    contextText += `- STATUS: ${allTasks.filter(t => t.status === 'done').length}/${allTasks.length} tarefas concluídas.\n`;
    contextText += `- DOMÍNIO (DDD): ${currentProject.ddd_contexts || 'Não definido'}\n`;
    contextText += `- LINGUAGEM UBÍQUA: ${currentProject.ddd_language || 'Não definido'}\n`;
    contextText += `- ENTIDADES: ${currentProject.ddd_entities || 'Não definido'}\n`;
    contextText += `- EVENTOS: ${currentProject.ddd_events || 'Não definido'}\n\n`;
    contextText += `## DIRETRIZ MESTRE:\nSempre utilize Domain-Driven Design (DDD). Organize o código em camadas (Domain, Application, Infrastructure). Use Repository Pattern para acesso a dados.\n`;

    const codeEl = document.getElementById('sync-code');
    if (codeEl) codeEl.innerText = contextText;
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

function fillBlueprintFields(p) {
    let colors = {}, screens = {}, flow = {};
    try { colors = typeof p.branding_colors === 'string' ? JSON.parse(p.branding_colors) : (p.branding_colors || {}); } catch(e){}
    try { screens = typeof p.screens === 'string' ? JSON.parse(p.screens) : (p.screens || {}); } catch(e){}
    try { flow = typeof p.user_flow === 'string' ? JSON.parse(p.user_flow) : (p.user_flow || {}); } catch(e){}

    const f = {
        'f-nome': p.name, 'f-desc': p.description, 'f-goal': p.goal, 'f-instructions': p.ai_instructions,
        'f-bmc-partners': p.bmc_partners, 'f-bmc-activities': p.bmc_activities, 'f-bmc-resources': p.bmc_resources,
        'f-value': p.value_proposition, 'f-bmc-relationships': p.bmc_relationships, 'f-bmc-channels': p.bmc_channels,
        'f-bmc-segments': p.bmc_segments, 'f-bmc-costs': p.bmc_costs, 'f-revenue': p.revenue_sources, 'f-metrics': p.metrics_north,
        
        'f-color-primary': colors.primary || '#6d58ff', 
        'f-color-secondary': colors.secondary || '#1a1a1e',
        'f-color-accent': colors.accent || '#9e8fff', 
        'f-color-success': colors.success || '#2ecc71',
        'f-color-error': colors.error || '#e74c3c', 
        'f-ui-radius': colors.ui_radius, 
        'f-ui-spacing': colors.ui_spacing,
        'f-font-head': colors.font_head, 
        'f-font-body': colors.font_body, 
        'f-font-scale': colors.font_scale,

        'f-journey': p.user_journey, 
        'f-behavior': flow.behavior, 
        'f-ui-feedback': flow.ui_feedback,
        'f-visual-refs': screens.visual_refs,
        
        'f-logic-states': flow.logic_states, 
        'f-logic-path': flow.logic_path, 
        'f-logic-empty': screens.logic_empty,
        'f-logic-errors': screens.logic_errors, 
        'f-logic-triggers': screens.logic_triggers, 
        'f-logic-anim': screens.logic_anim,
        'f-logic-sync': flow.logic_sync, 
        'f-logic-roles': flow.logic_roles,

        'f-ddd-language': screens.ddd_language, 
        'f-ddd-contexts': screens.ddd_contexts, 
        'f-ddd-events': screens.ddd_events, 
        'f-ddd-entities': screens.ddd_entities,

        't-front': p.frontend_stack, 't-back': p.tech_backend, 't-style': p.style_stack, 't-auth': p.tech_auth, 't-apis': p.tech_apis,
        'f-schema': p.db_schema, 'f-db-policies': p.db_policies,
        'f-git': p.github_url, 'f-supabase': p.supabase_config, 'f-vercel': p.vercel_url,
        'f-mvp': p.mvp_scope, 'f-roadmap-v2': p.roadmap_v2
    };
    for (let id in f) { const el = document.getElementById(id); if (el) el.value = f[id] || ''; }
    renderUXGallery();
}

function renderUXGallery() {
    const gallery = document.getElementById('ux-gallery');
    if (!gallery) return;
    let refs = [];
    try { refs = JSON.parse(document.getElementById('f-visual-refs').value || '[]'); } catch(e) {}
    gallery.innerHTML = refs.map(img => `<div class="ux-img-container"><img src="${img.data}" onclick="window.open('${img.data}')"><button class="ux-img-remove" onclick="removeUXImage(${img.id})">&times;</button></div>`).join('');
}

function renderPitchDeck() {
    const viewer = document.getElementById('slide-viewer');
    if (!viewer || !currentProject) return;

    let colors = {}, screens = {}, flow = {};
    try { colors = typeof currentProject.branding_colors === 'string' ? JSON.parse(currentProject.branding_colors) : (currentProject.branding_colors || {}); } catch(e){}
    try { screens = typeof currentProject.screens === 'string' ? JSON.parse(currentProject.screens) : (currentProject.screens || {}); } catch(e){}
    try { flow = typeof currentProject.user_flow === 'string' ? JSON.parse(currentProject.user_flow) : (currentProject.user_flow || {}); } catch(e){}

    const doneTasks = allTasks.filter(t => t.status === 'done').length;
    const totalTasks = allTasks.length;

    const slides = [
        // Slide 1: Visão Geral
        `<h2>PROJETO</h2><h1>${currentProject.name}</h1><p>${currentProject.description || 'Uma nova experiência digital.'}</p>`,
        
        // Slide 2: Missão
        `<h2>MISSÃO</h2><h1>O Propósito</h1><p>${currentProject.goal || 'Criar valor através de tecnologia e design centrado no usuário.'}</p>`,
        
        // Slide 3: Modelo de Negócio
        `<h2>BUSINESS</h2><h1>Modelo de Negócio</h1><p>${currentProject.value_proposition || 'Escalabilidade e eficiência operacional.'}</p>
         <p style="font-size:0.9rem; opacity:0.7">Canais: ${currentProject.bmc_channels || 'Não definidos'}</p>`,
        
        // Slide 4: Design System
        `<h2>DESIGN SYSTEM</h2><h1>Identidade Visual</h1>
         <div style="display:flex; justify-content:center; gap:10px; margin-top:20px">
            <div style="width:40px; height:40px; border-radius:8px; background:${colors.primary || '#6d58ff'}" title="Primary"></div>
            <div style="width:40px; height:40px; border-radius:8px; background:${colors.secondary || '#1a1a1e'}" title="Secondary"></div>
            <div style="width:40px; height:40px; border-radius:8px; background:${colors.accent || '#9e8fff'}" title="Accent"></div>
         </div>
         <p style="font-size:1.1rem; margin-top:15px">Tipografia: ${colors.font_head || 'Inter'}</p>`,
        
        // Slide 5: Stack Técnica
        `<h2>STACK TÉCNICA</h2><h1>Tecnologias</h1><p>Frontend: ${currentProject.frontend_stack || 'React'}</p>
         <p>Backend: ${currentProject.tech_backend || 'Node.js'}</p>`,
        
        // Slide 6: Dados & Segurança
        `<h2>DADOS</h2><h1>Segurança & Schema</h1><p>Banco: Supabase (PostgreSQL)</p>
         <p style="font-size:0.9rem; opacity:0.8">${currentProject.db_policies ? 'Políticas RLS Ativas' : 'Aguardando Configuração de RLS'}</p>`,
        
        // Slide 7: Infra & Deploy
        `<h2>INFRAESTRUTURA</h2><h1>Cloud & CI/CD</h1><p>Deploy: Vercel</p>
         <p style="font-size:0.9rem; opacity:0.8">Git: ${currentProject.github_url || 'Repositório Privado'}</p>`,
        
        // Slide 8: Escopo MVP
        `<h2>MVP SCOPE</h2><h1>Fase 1</h1><div style="font-size:1rem; max-height:150px; overflow:hidden">${currentProject.mvp_scope || 'Definição de funcionalidades essenciais.'}</div>`,
        
        // Slide 9: Arquitetura DDD
        `<h2>ARQUITETURA</h2><h1>Domain-Driven Design</h1><p>Domínio: ${screens.ddd_contexts || 'Bounded Contexts'}</p>
         <p style="font-size:0.9rem; opacity:0.8">Linguagem: ${screens.ddd_language || 'Ubiquitous Language'}</p>`,
        
        // Slide 10: Lógica de Experiência
        `<h2>UX LOGIC</h2><h1>Estados & Fluxos</h1><p>User Path: ${flow.logic_path || 'Fluxo de navegação principal.'}</p>
         <p style="font-size:1rem; margin-top:10px">Status: ${doneTasks} / ${totalTasks} Tarefas</p>`
    ];

    viewer.innerHTML = slides.map((c, i) => `<div class="slide ${i === currentSlide ? 'active' : ''}">${c}</div>`).join('');
    const num = document.getElementById('slide-number');
    if (num) num.innerText = `${currentSlide + 1} / ${slides.length}`;
}

// === DOC MANAGER UI ===

function renderDocList() {
    const list = document.getElementById('doc-list');
    if (!list) return;
    list.innerHTML = '';
    allDocs.forEach(doc => {
        const div = document.createElement('div');
        div.className = `doc-item ${currentDoc?.id === doc.id ? 'active' : ''}`;
        div.innerText = doc.filename;
        div.onclick = () => selectDoc(doc);
        list.appendChild(div);
    });
}

function selectDoc(doc) {
    currentDoc = doc;
    document.getElementById('active-doc-name').innerText = doc.filename;
    document.getElementById('doc-editor').value = doc.content || '';
    renderDocList();
}

function promptCreateDoc() {
    const name = prompt("Nome do arquivo (ex: journal.md):");
    if (name && typeof createDoc === 'function') createDoc(name);
}

function triggerDocAutoSave() {
    if (!currentDoc) return;
    const content = document.getElementById('doc-editor').value;
    currentDoc.content = content;
    
    document.getElementById('sync-status').innerText = "⏳ Alterando Doc...";
    clearTimeout(docSaveTimeout);
    docSaveTimeout = setTimeout(() => {
        if (typeof saveDoc === 'function') {
            saveDoc(currentDoc.filename, content);
            document.getElementById('sync-status').innerText = "✅ Sincronizado";
        }
    }, 1500);
}

function copyActiveDoc() {
    const content = document.getElementById('doc-editor').value;
    navigator.clipboard.writeText(content);
    alert("Markdown copiado!");
}
