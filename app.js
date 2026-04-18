// Universal Orchestrator - Main Entry Point
// Este arquivo apenas orquestra a inicialização dos módulos.

async function init() {
    console.log("🚀 Orquestrador Modular v13.1 Ativo");
    try {
        // A variável _supabase já é criada em js/config.js
        await loadProjects();
        const overlay = document.getElementById('loading-overlay');
        if (overlay) overlay.style.display = 'none';
        
        backToProjects();
    } catch (e) {
        console.error("Erro Crítico na Inicialização:", e);
        const overlay = document.getElementById('loading-overlay');
        if (overlay) {
            overlay.innerHTML = `
                <div style="text-align:center; padding: 20px;">
                    <h2 style="color:var(--red)">Erro de Conexão</h2>
                    <p>${e.message}</p>
                    <button class="btn btn-primary" onclick="location.reload()" style="margin-top:20px">Tentar Novamente</button>
                </div>
            `;
        }
    }
}

// Inicialização Global
document.addEventListener('DOMContentLoaded', init);
