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
        'f-screen-map': p.screen_map,
        'f-logic-states': p.logic_states, 'f-logic-path': p.logic_path, 'f-logic-empty': p.logic_empty,
        'f-logic-errors': p.logic_errors, 'f-logic-triggers': p.logic_triggers, 'f-logic-anim': p.logic_anim,
        'f-logic-sync': p.logic_sync, 'f-logic-roles': p.logic_roles,
        'f-ddd-language': p.ddd_language, 'f-ddd-contexts': p.ddd_contexts, 'f-ddd-events': p.ddd_events, 'f-ddd-entities': p.ddd_entities,
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
    const slides = [
        `<h1>${currentProject.name}</h1><h2>Missão</h2><p>${currentProject.goal || 'Foco no futuro.'}</p>`,
        `<h2>Status</h2><h1>${allTasks.filter(t=>t.status==='done').length}/${allTasks.length}</h1><p>Tarefas concluídas.</p>`
    ];
    viewer.innerHTML = slides.map((c, i) => `<div class="slide ${i === currentSlide ? 'active' : ''}">${c}</div>`).join('');
    const num = document.getElementById('slide-number');
    if (num) num.innerText = `${currentSlide + 1} / ${slides.length}`;
}
