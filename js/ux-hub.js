// UX Hub, IA e Interface
async function handleUXUpload(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        let refs = [];
        try { refs = JSON.parse(document.getElementById('f-visual-refs').value || '[]'); } catch(err) {}
        refs.push({ id: Date.now(), data: e.target.result });
        document.getElementById('f-visual-refs').value = JSON.stringify(refs);
        renderUXGallery();
        saveBlueprint();
    };
    reader.readAsDataURL(file);
}

function renderUXGallery() {
    const gallery = document.getElementById('ux-gallery');
    if (!gallery) return;
    let refs = [];
    try { refs = JSON.parse(document.getElementById('f-visual-refs').value || '[]'); } catch(err) {}
    gallery.innerHTML = refs.map(img => `<div class="ux-img-container"><img src="${img.data}" onclick="window.open('${img.data}')"><button class="ux-img-remove" onclick="removeUXImage(${img.id})">&times;</button></div>`).join('');
}

function removeUXImage(id) {
    let refs = [];
    try { refs = JSON.parse(document.getElementById('f-visual-refs').value || '[]'); } catch(err) {}
    refs = refs.filter(r => r.id !== id);
    document.getElementById('f-visual-refs').value = JSON.stringify(refs);
    renderUXGallery();
    saveBlueprint();
}

function generateDesignTokens() {
    const get = (id) => document.getElementById(id).value;
    const css = `:root {\n  --primary: ${get('f-color-primary')};\n  --secondary: ${get('f-color-secondary')};\n  --accent: ${get('f-color-accent')};\n  --radius: ${get('f-ui-radius') || '8px'};\n}`;
    navigator.clipboard.writeText(css);
    alert('Tokens Copiados!');
}

function updateAIContext() {
    if (!currentProject) return;
    const contextText = `# PROJETO: ${currentProject.name}\n- STATUS: ${allTasks.filter(t => t.status === 'done').length}/${allTasks.length} tarefas concluídas.`;
    const codeEl = document.getElementById('sync-code');
    if (codeEl) codeEl.innerText = contextText;
}

function generateSpecificPrompt() {
    const mode = document.getElementById('prompt-mode').value;
    const baseContext = document.getElementById('sync-code').innerText;
    let specific = "";
    if (mode === 'code') specific = "\n\nAtue como Sênior Dev. Gere o código baseado no contexto.";
    else if (mode === 'business') specific = "\n\nAnalise o modelo de negócios e sugira melhorias.";
    else if (mode === 'debug') specific = "\n\nIdentifique a causa raiz do erro técnico.";
    navigator.clipboard.writeText(baseContext + specific);
    alert('Prompt ' + mode + ' Copiado!');
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

function switchMainTab(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    const page = document.getElementById('page-' + id);
    const tab = document.getElementById('tab-' + id);
    if (page) page.classList.add('active');
    if (tab) tab.classList.add('active');
    if (id === 'metrics') renderMetrics();
    if (id === 'sync') updateAIContext();
    if (id === 'pitch') { currentSlide = 0; renderPitchDeck(); }
}

function switchBP(n) {
    document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.bp-nav-item').forEach(i => i.classList.remove('active'));
    const section = document.getElementById('bp-' + n);
    const navItems = document.querySelectorAll('.bp-nav-item');
    if (section) section.classList.add('active');
    if (navItems[n]) navItems[n].classList.add('active');
}

function openModal(type, targetStatus = 'todo') { 
    const el = document.getElementById(`modal-${type}`);
    if (el) el.style.display = 'flex'; 
    if (type === 'task') {
        const input = document.getElementById('task-status-target');
        if (input) input.value = targetStatus;
    }
}

function copySync() { navigator.clipboard.writeText(document.getElementById('sync-code').innerText); alert('Copiado!'); }
