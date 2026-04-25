const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();
app.use(cors());
app.use(bodyParser.json({ limit: '50mb' }));

const SUPABASE_URL = "https://rppctxuvncoqfgjbfczo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwcGN0eHV2bmNvcWZnamJmY3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NjU3ODQsImV4cCI6MjA5MTQ0MTc4NH0.OAzfJCLB7x3VpmRYBis4bvbseCDrfcVtZ6ZuBAjqIr4";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

const { execSync } = require('child_process');

app.post('/provision', async (req, res) => {
    const { projectName, basePath, gitUrl, vercelUrl } = req.body;
    console.log(`🚀 Provisionando Projeto: ${projectName}`);

    try {
        const { data: projects } = await supabase.from('projects').select('*').ilike('name', `%${projectName}%`);
        if (!projects || !projects.length) return res.status(404).send("Projeto não encontrado.");
        
        const project = projects[0];
        const folderName = project.name.toLowerCase().replace(/\s+/g, '-');
        const projectPath = path.join(basePath, folderName);

        if (!fs.existsSync(projectPath)) fs.mkdirSync(projectPath, { recursive: true });

        if (gitUrl) {
            try {
                if (!fs.existsSync(path.join(projectPath, '.git'))) {
                    execSync(`git init`, { cwd: projectPath });
                    execSync(`git remote add origin ${gitUrl}`, { cwd: projectPath });
                }
            } catch (e) {}
        }

        const { data: tasks } = await supabase.from('tasks').select('*, subtasks(*)').eq('project_id', project.id);
        fs.writeFileSync(path.join(projectPath, '.context-memory.json'), JSON.stringify({ last_sync: new Date(), project, tasks }, null, 2));

        res.status(200).json({ status: "success", path: projectPath });
    } catch (err) { res.status(500).send(err.message); }
});

app.post('/sync-docs', async (req, res) => {
    const { projectName, basePath, docs } = req.body;
    console.log(`📂 Sync Obsidian [${projectName}]: ${docs.length} arquivos.`);

    try {
        const folderName = projectName.toLowerCase().replace(/\s+/g, '-');
        const projectPath = path.join(basePath, folderName);
        const docsPath = path.join(projectPath, 'docs');

        if (!fs.existsSync(docsPath)) fs.mkdirSync(docsPath, { recursive: true });

        docs.forEach(doc => {
            const fileName = doc.filename.endsWith('.md') ? doc.filename : `${doc.filename}.md`;
            fs.writeFileSync(path.join(docsPath, fileName), doc.content);
        });

        res.status(200).json({ status: "success", count: docs.length });
    } catch (err) {
        res.status(500).send(err.message);
    }
});

app.listen(3000, () => {
    console.log("🖥️  AGENTE LOCAL ATIVO (Porta 3000)");
});
