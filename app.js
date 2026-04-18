// Universal Orchestrator - Main Entry Point v13.1.2
// Este arquivo apenas orquestra a inicialização dos módulos.

async function init() {
    console.log("🚀 Orquestrador Modular v13.1.2 Ativo");
    
    // Pequena espera para garantir que todos os scripts foram interpretados
    setTimeout(async () => {
        try {
            if (typeof loadProjects === 'undefined') {
                throw new Error("Modulo de Projetos nao carregado. Tente Ctrl+F5.");
            }

            await loadProjects();
            const overlay = document.getElementById('loading-overlay');
            if (overlay) overlay.style.display = 'none';
            
            backToProjects();
            console.log("✅ Inicializacao completa.");
        } catch (e) {
            console.error("Erro Critico na Inicializacao:", e);
            const overlay = document.getElementById('loading-overlay');
            if (overlay) {
                overlay.innerHTML = `
                    <div style="text-align:center; padding: 20px;">
                        <h2 style="color:var(--red)">Erro de Conexao</h2>
                        <p>${e.message}</p>
                        <button class="btn btn-primary" onclick="location.reload()" style="margin-top:20px">Tentar Novamente</button>
                    </div>
                `;
            }
        }
    }, 500); // 500ms de seguranca
}

// Inicialização Global
document.addEventListener('DOMContentLoaded', init);
