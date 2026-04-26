// Universal Orchestrator - User Interactions & Event Handlers

function handleDragStart(e, taskId) { 
    e.dataTransfer.setData('text/plain', taskId); 
}

function handleDragOver(e) { 
    e.preventDefault(); 
}

async function handleDrop(e, targetStatus) {
    const taskId = e.dataTransfer.getData('text/plain');
    await _supabase.from('tasks').update({ status: targetStatus }).eq('id', taskId);
    if (typeof loadRoadmap === 'function') loadRoadmap();
}

async function handleUXUpload(input) {
    const file = input.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (e) => {
        let refs = [];
        try { refs = JSON.parse(document.getElementById('f-visual-refs').value || '[]'); } catch(err) {}
        refs.push({ id: Date.now(), data: e.target.result });
        document.getElementById('f-visual-refs').value = JSON.stringify(refs);
        if (typeof renderUXGallery === 'function') renderUXGallery();
        if (typeof saveBlueprint === 'function') saveBlueprint();
    };
    reader.readAsDataURL(file);
}

function removeUXImage(id) {
    let refs = JSON.parse(document.getElementById('f-visual-refs').value || '[]');
    refs = refs.filter(r => r.id !== id);
    document.getElementById('f-visual-refs').value = JSON.stringify(refs);
    if (typeof renderUXGallery === 'function') renderUXGallery();
    if (typeof saveBlueprint === 'function') saveBlueprint();
}

function generateDesignTokens() {
    const get = (id) => document.getElementById(id).value;
    const css = `:root {\n  --primary: ${get('f-color-primary')};\n  --secondary: ${get('f-color-secondary')};\n  --accent: ${get('f-color-accent')};\n  --radius: ${get('f-ui-radius') || '8px'};\n}`;
    navigator.clipboard.writeText(css);
    alert('Tokens Copiados!');
}

function nextSlide() { 
    if (currentSlide < 9) { 
        currentSlide++; 
        if (typeof renderPitchDeck === 'function') renderPitchDeck(); 
    } 
}

function prevSlide() { 
    if (currentSlide > 0) { 
        currentSlide--; 
        if (typeof renderPitchDeck === 'function') renderPitchDeck(); 
    } 
}

function exportBlueprintMarkdown() {
    if (!currentProject) return;
    const md = `# BLUEPRINT: ${currentProject.name}\nGerado via Universal Orchestrator.`;
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `blueprint-${currentProject.name}.md`;
    a.click();
}

function triggerAutoSave() {
    const s = document.getElementById('sync-status');
    if (s) { s.innerText = "⏳ Alterando..."; s.style.color = "var(--amber)"; }
    clearTimeout(saveTimeout);
    if (typeof saveBlueprint === 'function') {
        saveTimeout = setTimeout(saveBlueprint, 1500);
    }
}

function copySync() { 
    navigator.clipboard.writeText(document.getElementById('sync-code').innerText); 
    alert('Copiado!'); 
}
