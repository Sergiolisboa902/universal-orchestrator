const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(bodyParser.json());

const SUPABASE_URL = "https://rppctxuvncoqfgjbfczo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwcGN0eHV2bmNvcWZnamJmY3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NjU3ODQsImV4cCI6MjA5MTQ0MTc4NH0.OAzfJCLB7x3VpmRYBis4bvbseCDrfcVtZ6ZuBAjqIr4";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

app.post('/provision', async (req, res) => {
    const { projectName, basePath } = req.body;
    console.log(`🚀 Recebida ordem de provisionamento: ${projectName} em ${basePath}`);

    try {
        // 1. Buscar dados completos do projeto no Supabase
        const { data: projects } = await supabase.from('projects').select('*').ilike('name', `%${projectName}%`);
        if (!projects || !projects.length) return res.status(404).send("Projeto não encontrado no banco.");
        
        const project = projects[0];
        const folderName = project.name.toLowerCase().replace(/\s+/g, '-');
        const projectPath = path.join(basePath, folderName);

        // 2. Criar Pasta
        if (!fs.existsSync(projectPath)) {
            fs.mkdirSync(projectPath, { recursive: true });
        }

        // 3. Gerar Memória de Contexto
        const { data: tasks } = await supabase.from('tasks').select('*, subtasks(*)').eq('project_id', project.id);
        const contextMemory = { last_sync: new Date().toISOString(), project, tasks: tasks || [] };
        fs.writeFileSync(path.join(projectPath, '.context-memory.json'), JSON.stringify(contextMemory, null, 2));

        // 4. Criar README Inicial
        const readmeContent = `# ${project.name}\n\nProvisionado via Universal Orchestrator.\n\n## Local Path\n\`${projectPath}\``;
        fs.writeFileSync(path.join(projectPath, 'README.md'), readmeContent);

        console.log(`✅ Sucesso: ${projectPath}`);
        res.status(200).json({ status: "success", path: projectPath });

    } catch (err) {
        console.error("❌ Erro:", err.message);
        res.status(500).send(err.message);
    }
});

app.listen(3000, () => {
    console.log("🖥️  AGENTE LOCAL ATIVO (Porta 3000)");
    console.log("Aguardando comandos do Orquestrador...");
});
