const SUPABASE_URL = "https://rppctxuvncoqfgjbfczo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwcGN0eHV2bmNvcWZnamJmY3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NjU3ODQsImV4cCI6MjA5MTQ0MTc4NH0.OAzfJCLB7x3VpmRYBis4bvbseCDrfcVtZ6ZuBAjqIr4";
const _supabase = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

let currentProject = null;
let allTasks = [];

async function init() {
    try {
        const { data: projects, error: pError } = await _supabase.from('projects').select('*').eq('name', 'Universal Orchestrator');
        
        if (projects && projects.length > 0) {
            currentProject = projects[0];
        } else {
            const { data: newProj, error: cError } = await _supabase.from('projects').insert([{ name: 'Universal Orchestrator', status: 'active' }]).select();
            currentProject = newProj[0];
            
            await _supabase.from('tasks').insert([
                { project_id: currentProject.id, title: 'Setup GitHub', category: 'Infra', status: 'done', description: 'Repositório remoto configurado.' },
                { project_id: currentProject.id, title: 'Setup Supabase', category: 'Infra', status: 'doing', description: 'Banco de dados e tabelas prontas.' },
                { project_id: currentProject.id, title: 'Setup Vercel', category: 'Infra', status: 'todo', description: 'Deploy contínuo ativo.' }
            ]);
        }

        await loadRoadmap();
        document.getElementById('loading-overlay').style.display = 'none';
    } catch (e) {
        console.error(e);
        document.getElementById('loading-overlay').innerHTML = `<div>Erro na conexão: ${e.message}</div>`;
    }
}

async function loadRoadmap() {
    const { data: tasks, error } = await _supabase.from('tasks').select('*').eq('project_id', currentProject.id).order('created_at', { ascending: true });
    allTasks = tasks || [];
    
    const lists = { 
        todo: document.getElementById('list-todo'), 
        doing: document.getElementById('list-doing'), 
        done: document.getElementById('list-done') 
    };
    
    Object.values(lists).forEach(l => l.innerHTML = '');

    allTasks.forEach(t => {
        const card = document.createElement('div');
        card.className = 'task-card';
        card.onclick = () => cycleStatus(t.id, t.status);
        card.innerHTML = `
            <span class="category-tag">${t.category}</span>
            <span class="task-title">${t.title}</span>
            <p class="task-desc">${t.description || 'Sem descrição definida para esta tarefa.'}</p>
        `;
        lists[t.status].appendChild(card);
    });

    updateAIContext();
}

async function cycleStatus(id, current) {
    const next = current === 'todo' ? 'doing' : (current === 'doing' ? 'done' : 'todo');
    await _supabase.from('tasks').update({ status: next }).eq('id', id);
    loadRoadmap();
}

function updateAIContext() {
    const doing = allTasks.filter(t => t.status === 'doing');
    const pending = allTasks.filter(t => t.status === 'todo');
    const done = allTasks.filter(t => t.status === 'done');

    const contextText = `
# PROJETO: ${currentProject.name}
# OBJETIVO: Gestor de Projetos Completo para IA

## ESTADO ATUAL
- EM FOCO AGORA: ${doing.map(t => t.title).join(', ') || 'Aguardando definição'}
- PRÓXIMAS TAREFAS: ${pending.slice(0, 3).map(t => t.title).join(', ')}
- JÁ CONCLUÍDO: ${done.length} tarefas finalizadas

## COMANDO PARA ENGENHEIRO IA
"Engenheiro, analise o progresso acima. As tarefas em foco são [${doing.map(t => t.title).join(', ')}]. 
Por favor, sugira os próximos passos técnicos e gere o código necessário para avançar o desenvolvimento."
    `.trim();

    document.getElementById('sync-code').innerText = contextText;
}

function switchMainTab(id) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
    document.getElementById('page-' + id).classList.add('active');
    document.getElementById('tab-' + id).classList.add('active');
}

function switchBP(n) {
    document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
    document.querySelectorAll('.bp-nav-item').forEach(i => i.classList.remove('active'));
    document.getElementById('bp-' + n).classList.add('active');
    document.querySelectorAll('.bp-nav-item')[n].classList.add('active');
}

function copySync() {
    const text = document.getElementById('sync-code').innerText;
    navigator.clipboard.writeText(text).then(() => {
        const btn = document.querySelector('#page-sync .btn-primary');
        const originalText = btn.innerText;
        btn.innerText = "Copiado!";
        btn.style.background = "var(--green)";
        setTimeout(() => {
            btn.innerText = originalText;
            btn.style.background = "var(--accent)";
        }, 2000);
    });
}

// Inicia a aplicação
init();
