// Universal Orchestrator - Main Entry Point

async function init() {
    console.log("🚀 Orquestrador Modular v13.1.0 Ativo");
    try {
        // Usa CONFIG definido em config.js (ou variável global anterior)
        if (typeof supabase !== 'undefined' && typeof CONFIG !== 'undefined') {
            _supabase = supabase.createClient(CONFIG.SUPABASE_URL, CONFIG.SUPABASE_KEY);
        } else {
            throw new Error("Supabase SDK ou CONFIG não encontrados.");
        }

        if (typeof loadProjects === 'function') {
            await loadProjects();
        }

        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.style.display = 'none';
        
        if (typeof backToProjects === 'function') {
            backToProjects();
        }
    } catch (e) {
        console.error("Erro init:", e);
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.innerHTML = `<div style="text-align:center; padding: 20px;">
                <h2 style="color:var(--red)">Erro de Inicialização</h2>
                <p>${e.message}</p>
                <button class="btn btn-primary" onclick="location.reload()" style="margin-top:20px">Tentar Novamente</button>
            </div>`;
        }
    }
}

function selectProjectById(id) {
    const project = allProjects.find(p => p.id === id);
    if (project && typeof selectProject === 'function') {
        selectProject(project);
    }
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

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', init);
