const { createClient } = require('@supabase/supabase-js');
const SUPABASE_URL = "https://rppctxuvncoqfgjbfczo.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJwcGN0eHV2bmNvcWZnamJmY3pvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzU4NjU3ODQsImV4cCI6MjA5MTQ0MTc4NH0.OAzfJCLB7x3VpmRYBis4bvbseCDrfcVtZ6ZuBAjqIr4";
const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function forceSyncAll() {
    const { data: projects } = await supabase.from('projects').select('*');
    if (!projects) return;

    for (const p of projects) {
        console.log('Sincronizando projeto:', p.name);
        const md = `# Blueprint: ${p.name || 'Sem nome'}

## 🎯 Fundamentos
- **Problema:** ${p.description || ''}
- **Missão:** ${p.goal || ''}

## 💼 Business Model Canvas
- **Proposta de Valor:** ${p.value_proposition || ''}
- **Segmentos:** ${p.bmc_segments || ''}

## 🎯 Arquitetura DDD
- **Linguagem Ubíqua:** ${p.ddd_language || ''}
- **Bounded Contexts:** ${p.ddd_contexts || ''}
- **Eventos:** ${p.ddd_events || ''}
- **Entidades:** ${p.ddd_entities || ''}

## ⚙️ Stack
- **Frontend:** ${p.frontend_stack || ''}
- **Backend:** ${p.tech_backend || ''}

## 🚀 Roadmap MVP
${p.mvp_scope || ''}
`;
        await supabase.from('project_docs').upsert({
            project_id: p.id,
            filename: 'blueprint.md',
            content: md,
            updated_at: new Date()
        }, { onConflict: 'project_id,filename' });
    }
    console.log('Sincronização forçada concluída.');
}

forceSyncAll();
