// Universal Orchestrator - Utilities & UI Controls

/**
 * Formata segundos em HH:MM:SS
 */
function formatTime(seconds) {
    if (!seconds && seconds !== 0) return "00:00:00";
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return [h, m, s].map(v => v < 10 ? "0" + v : v).join(":");
}

/**
 * Abre um modal por ID de tipo
 */
function openModal(type, targetStatus = 'todo') {
    const el = document.getElementById(`modal-${type}`);
    if (el) el.style.display = 'flex';
    if (type === 'task') {
        const input = document.getElementById('task-status-target');
        if (input) input.value = targetStatus;
    }
}

/**
 * Fecha um modal por ID de tipo (Versão genérica)
 */
function closeModal(type) {
    // Se for o modal de detalhes da tarefa, delegamos para o timer.js se necessário,
    // mas mantemos esta função genérica para outros modais.
    const el = document.getElementById(`modal-${type}`);
    if (el) el.style.display = 'none';
}

/**
 * Alterna entre abas principais do dashboard
 */
function switchMainTab(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const page = document.getElementById('page-' + id);
    const tab = document.getElementById('tab-' + id);
    if (page) page.classList.add('active');
    if (tab) tab.classList.add('active');
    
    // Gatilhos de renderização específica
    if (id === 'metrics') if (typeof renderMetrics === 'function') renderMetrics();
    if (id === 'sync') if (typeof updateAIContext === 'function') updateAIContext();
    if (id === 'pitch') { 
        currentSlide = 0; 
        if (typeof renderPitchDeck === 'function') renderPitchDeck(); 
    }
}

/**
 * Alterna seções dentro do Blueprint
 */
function switchBP(n) {
    document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.bp-nav-item').forEach(i => i.classList.remove('active'));
    const section = document.getElementById('bp-' + n);
    const navItems = document.querySelectorAll('.bp-nav-item');
    if (section) section.classList.add('active');
    if (navItems[n]) navItems[n].classList.add('active');
}
