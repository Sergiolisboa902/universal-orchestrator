// Universal Orchestrator - API Service (Supabase CRUD)

async function loadProjects() {
    const { data, error } = await _supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    allProjects = data || [];
    if (typeof renderProjectGrid === 'function') renderProjectGrid();
}

async function createProject() {
    const name = document.getElementById('new-project-name').value;
    const basePath = document.getElementById('new-project-path').value;
    const gitUrl = document.getElementById('new-project-git').value;
    const vercelUrl = document.getElementById('new-project-vercel').value;
    const supabaseConf = document.getElementById('new-project-supabase').value;

    if (!name) return alert('Nome obrigatório');
    const projectData = { name, status: 'active', github_url: gitUrl, vercel_url: vercelUrl, supabase_config: supabaseConf };
    const { data, error } = await _supabase.from('projects').insert([projectData]).select();
    if (error) return alert('Erro: ' + error.message);

    if (typeof injectFoundationalTasks === 'function') await injectFoundationalTasks(data[0].id);

    try {
        await fetch('http://localhost:3000/provision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectName: name, basePath, gitUrl, vercelUrl })
        });
    } catch (e) {}

    closeModal('project');
    await loadProjects();
    if (typeof selectProject === 'function') selectProject(data[0]);
}

async function deleteProject(event, id) {
    event.stopPropagation();
    if (!confirm('Excluir projeto e tarefas?')) return;
    await _supabase.from('tasks').delete().eq('project_id', id);
    await _supabase.from('projects').delete().eq('id', id);
    await loadProjects();
}

async function createTask() {
    const title = document.getElementById('task-title').value;
    const description = document.getElementById('task-desc').value;
    const category = document.getElementById('task-category').value;
    const status = document.getElementById('task-status-target').value;
    if (!title) return alert('Título obrigatório');
    await _supabase.from('tasks').insert([{ project_id: currentProject.id, title, description, category, status }]);
    closeModal('task');
    if (typeof loadRoadmap === 'function') loadRoadmap();
}

async function loadRoadmap() {
    if (!currentProject) return;
    const { data: tasks } = await _supabase.from('tasks').select('*, subtasks(*)').eq('project_id', currentProject.id).order('created_at', { ascending: true });
    allTasks = tasks || [];
    if (typeof renderKanban === 'function') renderKanban();
}

async function addSubtask() {
    const input = document.getElementById('new-subtask-name');
    if (!input || !input.value) return;
    await _supabase.from('subtasks').insert([{ task_id: currentTask.id, text: input.value, done: false }]);
    input.value = '';
    const { data } = await _supabase.from('subtasks').select('*').eq('task_id', currentTask.id).order('created_at', { ascending: true });
    currentTask.subtasks = data || [];
    if (typeof renderChecklist === 'function') renderChecklist();
    if (typeof loadRoadmap === 'function') loadRoadmap();
}

async function toggleSubtask(id, currentStatus) {
    await _supabase.from('subtasks').update({ done: !currentStatus }).eq('id', id);
    const { data } = await _supabase.from('subtasks').select('*').eq('task_id', currentTask.id).order('created_at', { ascending: true });
    currentTask.subtasks = data || [];
    if (typeof renderChecklist === 'function') renderChecklist();
    if (typeof loadRoadmap === 'function') loadRoadmap();
}

async function deleteCurrentTask() {
    if (!confirm('Excluir tarefa?')) return;
    await _supabase.from('tasks').delete().eq('id', currentTask.id);
    // Usamos a versão global de closeModal aqui, o timer.js lida com os detalhes
    const el = document.getElementById(`modal-task-details`);
    if (el) el.style.display = 'none';
    if (typeof loadRoadmap === 'function') loadRoadmap();
}

async function saveBlueprint() {
    if (!currentProject) return;
    const s = document.getElementById('sync-status');
    const getVal = (id) => document.getElementById(id)?.value || '';
    
    const data = {
        name: getVal('f-nome'),
        description: getVal('f-desc'),
        goal: getVal('f-goal'),
        ai_instructions: getVal('f-instructions'),
        bmc_partners: getVal('f-bmc-partners'),
        bmc_activities: getVal('f-bmc-activities'),
        bmc_resources: getVal('f-bmc-resources'),
        value_proposition: getVal('f-value'),
        bmc_relationships: getVal('f-bmc-relationships'),
        bmc_channels: getVal('f-bmc-channels'),
        bmc_segments: getVal('f-bmc-segments'),
        bmc_costs: getVal('f-bmc-costs'),
        revenue_sources: getVal('f-revenue'),
        metrics_north: getVal('f-metrics'),
        color_primary: getVal('f-color-primary'),
        color_secondary: getVal('f-color-secondary'),
        color_accent: getVal('f-color-accent'),
        color_success: getVal('f-color-success'),
        color_error: getVal('f-color-error'),
        ui_radius: getVal('f-ui-radius'),
        ui_spacing: getVal('f-ui-spacing'),
        font_head: getVal('f-font-head'),
        font_body: getVal('f-font-body'),
        font_scale: getVal('f-font-scale'),
        user_journey: getVal('f-journey'),
        behavior_rules: getVal('f-behavior'),
        ui_feedback: getVal('f-ui-feedback'),
        visual_refs: getVal('f-visual-refs'),
        screen_map: getVal('f-screen-map'),
        logic_states: getVal('f-logic-states'),
        logic_path: getVal('f-logic-path'),
        logic_empty: getVal('f-logic-empty'),
        logic_errors: getVal('f-logic-errors'),
        logic_triggers: getVal('f-logic-triggers'),
        logic_anim: getVal('f-logic-anim'),
        logic_sync: getVal('f-logic-sync'),
        logic_roles: getVal('f-logic-roles'),
        ddd_language: getVal('f-ddd-language'),
        ddd_contexts: getVal('f-ddd-contexts'),
        ddd_events: getVal('f-ddd-events'),
        ddd_entities: getVal('f-ddd-entities'),
        frontend_stack: getVal('t-front'),
        tech_backend: getVal('t-back'),
        style_stack: getVal('t-style'),
        tech_auth: getVal('t-auth'),
        tech_apis: getVal('t-apis'),
        db_schema: getVal('f-schema'),
        db_policies: getVal('f-db-policies'),
        github_url: getVal('f-git'),
        supabase_config: getVal('f-supabase'),
        vercel_url: getVal('f-vercel'),
        mvp_scope: getVal('f-mvp'),
        roadmap_v2: getVal('f-roadmap-v2')
    };
    
    try {
        await _supabase.from('projects').update(data).eq('id', currentProject.id);
        if (s) { s.innerText = "✅ Sincronizado"; s.style.color = "var(--green)"; }
    } catch (e) { if (s) s.innerText = "❌ Erro"; }
}
