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
        { project_id: projectId, category: 'blueprint', title: '🎯 1. Fundamentos do Sistema', status: 'todo' },
        { project_id: projectId, category: 'business', title: '💼 2. Business Model Canvas', status: 'todo' },
        { project_id: projectId, category: 'design', title: '🎨 3. UX Engineering & Design System', status: 'todo' },
        { project_id: projectId, category: 'back', title: '⚙️ 4. Stack Técnica', status: 'todo' },
        { project_id: projectId, category: 'back', title: '💾 5. Dados & Segurança', status: 'todo' },
        { project_id: projectId, category: 'infra', title: '🏗️ 6. Infra & Deploy', status: 'todo' },
        { project_id: projectId, category: 'blueprint', title: '🚀 7. Definição do MVP', status: 'todo' },
        { project_id: projectId, category: 'blueprint', title: '🎯 8. Arquitetura & Domínio (DDD)', status: 'todo' },
        { project_id: projectId, category: 'design', title: '🧠 9. Experience Logic & States', status: 'todo' }
    ];
    await _supabase.from('tasks').insert(epics);
}

// Inicializar quando o DOM estiver pronto
document.addEventListener('DOMContentLoaded', init);
