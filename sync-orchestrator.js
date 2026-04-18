const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Configurações do Universal Orchestrator
const SUPABASE_URL = "https://rppctxuvncoqfgjbfczo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwcGN0eHV2bmNvcWZnamJmY3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NjU3ODQsImV4cCI6MjA5MTQ0MTc4NH0.OAzfJCLB7x3VpmRYBis4bvbseCDrfcVtZ6ZuBAjqIr4";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function syncProject(projectName) {
    console.log(`🔍 Buscando contexto para: "${projectName}"...`);
    try {
        const { data: projects, error: pError } = await supabase.from('projects').select('*').ilike('name', `%${projectName}%`);
        if (pError || !projects.length) { console.error("❌ Projeto não encontrado."); return; }
        const project = projects[0];
        const { data: tasks, error: tError } = await supabase.from('tasks').select('*, subtasks(*)').eq('project_id', project.id);
        const contextMemory = { last_sync: new Date().toISOString(), project, tasks: tasks || [] };
        fs.writeFileSync(path.join(process.cwd(), '.context-memory.json'), JSON.stringify(contextMemory, null, 2));
        console.log(`✨ MEMÓRIA SINCRONIZADA: ${project.name}`);
    } catch (err) { console.error("❌ Erro:", err.message); }
}

async function updateTaskStatus(taskTitle, newStatus) {
    console.log(`🔄 Atualizando tarefa "${taskTitle}" para [${newStatus}]...`);
    try {
        const memory = JSON.parse(fs.readFileSync('.context-memory.json'));
        const { data, error } = await supabase.from('tasks')
            .update({ status: newStatus })
            .ilike('title', `%${taskTitle}%`)
            .eq('project_id', memory.project.id)
            .select();
        
        if (error || !data.length) { console.error("❌ Tarefa não encontrada no Supabase."); return; }
        console.log(`✅ Tarefa "${data[0].title}" movida para ${newStatus}.`);
        await syncProject(memory.project.name); // Re-sincroniza após alteração
    } catch (err) { console.error("❌ Erro:", err.message); }
}

async function toggleSubtask(subtaskText, doneStatus) {
    console.log(`🔘 Marcando sub-tarefa "${subtaskText}" como ${doneStatus ? 'CONCLUÍDA' : 'PENDENTE'}...`);
    try {
        const memory = JSON.parse(fs.readFileSync('.context-memory.json'));
        const { data, error } = await supabase.from('subtasks')
            .update({ done: doneStatus })
            .ilike('text', `%${subtaskText}%`)
            .select();
            
        if (error || !data.length) { console.error("❌ Sub-tarefa não encontrada."); return; }
        console.log(`✅ Sub-tarefa "${data[0].text}" atualizada.`);
        await syncProject(memory.project.name);
    } catch (err) { console.error("❌ Erro:", err.message); }
}

async function provisionLocalProject(projectName) {
    console.log(`🏗️  Provisionando estrutura local para: "${projectName}"...`);
    try {
        const { data: projects } = await supabase.from('projects').select('*').ilike('name', `%${projectName}%`);
        if (!projects.length) { console.error("❌ Projeto não encontrado no Orquestrador."); return; }
        
        const project = projects[0];
        const folderName = project.name.toLowerCase().replace(/\s+/g, '-');
        const projectPath = path.join('C:\\Users\\Adm\\Documents\\Projetos', folderName);

        // 1. Criar Diretório
        if (!fs.existsSync(projectPath)) {
            fs.mkdirSync(projectPath, { recursive: true });
            console.log(`📁 Pasta criada: ${projectPath}`);
        }

        // 2. Sincronizar Memória na nova pasta
        const { data: tasks } = await supabase.from('tasks').select('*, subtasks(*)').eq('project_id', project.id);
        const contextMemory = { last_sync: new Date().toISOString(), project, tasks: tasks || [] };
        fs.writeFileSync(path.join(projectPath, '.context-memory.json'), JSON.stringify(contextMemory, null, 2));

        // 3. Criar Arquivos Base (Scaffold)
        const readmeContent = `# ${project.name}\n\n${project.description || 'Projeto orquestrado via Universal Orchestrator.'}\n\n## Stack\n- Front: ${project.frontend_stack || 'A definir'}`;
        fs.writeFileSync(path.join(projectPath, 'README.md'), readmeContent);
        
        console.log(`✨ PROJETO "${project.name}" VINCULADO AO COMPUTADOR!`);
        console.log(`👉 Caminho: ${projectPath}`);
    } catch (err) { console.error("❌ Erro no provisionamento:", err.message); }
}

// CLI Interface
const args = process.argv.slice(2);
const [cmd, val1, val2] = args;

if (cmd === '--sync' && val1) syncProject(val1);
else if (cmd === '--update-task' && val1 && val2) updateTaskStatus(val1, val2);
else if (cmd === '--toggle-sub' && val1 && val2) toggleSubtask(val1, val2 === 'true');
else if (cmd === '--provision' && val1) provisionLocalProject(val1);
else {
    console.log("Uso:");
    console.log("  node sync-orchestrator.js --sync \"Projeto\"");
    console.log("  node sync-orchestrator.js --update-task \"Título\" \"todo|doing|done\"");
    console.log("  node sync-orchestrator.js --toggle-sub \"Texto\" \"true|false\"");
}
