// Gestão de Projetos (CRUD e Provisionamento)
async function loadProjects() {
    const { data, error } = await _supabase.from('projects').select('*').order('created_at', { ascending: false });
    if (error) throw error;
    allProjects = data || [];
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
    if (!confirm('Excluir projeto e tarefas?')) return;
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

    if (!name) return alert('Nome obrigatório');
    const projectData = { name, status: 'active', github_url: gitUrl, vercel_url: vercelUrl, supabase_config: supabaseConf };
    const { data, error } = await _supabase.from('projects').insert([projectData]).select();
    if (error) return alert('Erro: ' + error.message);
    
    await injectFoundationalTasks(data[0].id);
    
    try {
        await fetch('http://localhost:3000/provision', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ projectName: name, basePath, gitUrl, vercelUrl })
        });
    } catch (e) { console.warn("Agente local offline."); }

    closeModal('project');
    await loadProjects();
    selectProject(data[0]);
}

async function injectFoundationalTasks(projectId) {
    const epics = [
        { project_id: projectId, category: 'blueprint', title: '🎯 1. Preencher Fundamentos', status: 'todo' },
        { project_id: projectId, category: 'business', title: '💼 2. Business Model Canvas', status: 'todo' },
        { project_id: projectId, category: 'design', title: '🎨 3. UX & Identidade Visual', status: 'todo' },
        { project_id: projectId, category: 'back', title: '⚙️ 4. Definir Stack & Arquitetura', status: 'todo' },
        { project_id: projectId, category: 'back', title: '💾 5. Modelagem de Dados', status: 'todo' },
        { project_id: projectId, category: 'infra', title: '🏗️ 6. Setup Infra & DevOps', status: 'todo' },
        { project_id: projectId, category: 'blueprint', title: '🚀 7. Definir Escopo MVP', status: 'todo' },
        { project_id: projectId, category: 'design', title: '🧠 8. Engenharia de Experiência', status: 'todo' }
    ];
    await _supabase.from('tasks').insert(epics);
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
