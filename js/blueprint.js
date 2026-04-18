// Sincronização de Blueprint
function triggerAutoSave() {
    const s = document.getElementById('sync-status');
    if (s) { s.innerText = "⏳ Alterando..."; s.style.color = "var(--amber)"; }
    clearTimeout(saveTimeout);
    saveTimeout = setTimeout(saveBlueprint, 1500);
}

async function saveBlueprint() {
    if (!currentProject) return;
    const s = document.getElementById('sync-status');
    const val = (id) => document.getElementById(id)?.value || '';

    const data = {
        name: val('f-nome'), description: val('f-desc'), goal: val('f-goal'), ai_instructions: val('f-instructions'),
        bmc_partners: val('f-bmc-partners'), bmc_activities: val('f-bmc-activities'), bmc_resources: val('f-bmc-resources'),
        value_proposition: val('f-value'), bmc_relationships: val('f-bmc-relationships'), bmc_channels: val('f-bmc-channels'),
        bmc_segments: val('f-bmc-segments'), bmc_costs: val('f-bmc-costs'), revenue_sources: val('f-revenue'),
        metrics_north: val('f-metrics'), color_primary: val('f-color-primary'), color_secondary: val('f-color-secondary'),
        color_accent: val('f-color-accent'), color_success: val('f-color-success'), color_error: val('f-color-error'),
        ui_radius: val('f-ui-radius'), ui_spacing: val('f-ui-spacing'), font_head: val('f-font-head'),
        font_body: val('f-font-body'), font_scale: val('f-font-scale'), user_journey: val('f-journey'),
        behavior_rules: val('f-behavior'), ui_feedback: val('f-ui-feedback'), visual_refs: val('f-visual-refs'),
        screen_map: val('f-screen-map'), logic_states: val('f-logic-states'), logic_path: val('f-logic-path'),
        logic_empty: val('f-logic-empty'), logic_errors: val('f-logic-errors'), logic_triggers: val('f-logic-triggers'),
        logic_anim: val('f-logic-anim'), logic_sync: val('f-logic-sync'), logic_roles: val('f-logic-roles'),
        frontend_stack: val('t-front'), tech_backend: val('t-back'), style_stack: val('t-style'),
        tech_auth: val('t-auth'), tech_apis: val('t-apis'), db_schema: val('f-schema'),
        db_policies: val('f-db-policies'), github_url: val('f-git'), supabase_config: val('f-supabase'),
        vercel_url: val('f-vercel'), mvp_scope: val('f-mvp'), roadmap_v2: val('f-roadmap-v2')
    };

    try {
        await _supabase.from('projects').update(data).eq('id', currentProject.id);
        if (s) { s.innerText = "OK Sincronizado"; s.style.color = "var(--green)"; }
    } catch (e) { if (s) { s.innerText = "Erro"; s.style.color = "var(--red)"; } }
}

function fillBlueprintFields(p) {
    const f = {
        'f-nome': p.name, 'f-desc': p.description, 'f-goal': p.goal, 'f-instructions': p.ai_instructions,
        'f-bmc-partners': p.bmc_partners, 'f-bmc-activities': p.bmc_activities, 'f-bmc-resources': p.bmc_resources,
        'f-value': p.value_proposition, 'f-bmc-relationships': p.bmc_relationships, 'f-bmc-channels': p.bmc_channels,
        'f-bmc-segments': p.bmc_segments, 'f-bmc-costs': p.bmc_costs, 'f-revenue': p.revenue_sources, 'f-metrics': p.metrics_north,
        'f-color-primary': p.color_primary || '#6d58ff', 'f-color-secondary': p.color_secondary || '#1a1a1e',
        'f-color-accent': p.color_accent || '#9e8fff', 'f-color-success': p.color_success || '#2ecc71',
        'f-color-error': p.color_error || '#e74c3c', 'f-ui-radius': p.ui_radius, 'f-ui-spacing': p.ui_spacing,
        'f-font-head': p.font_head, 'f-font-body': p.font_body, 'f-font-scale': p.font_scale,
        'f-journey': p.user_journey, 'f-behavior': p.behavior_rules, 'f-ui-feedback': p.ui_feedback,
        'f-visual-refs': p.visual_refs, 'f-screen-map': p.screen_map,
        'f-logic-states': p.logic_states, 'f-logic-path': p.logic_path, 'f-logic-empty': p.logic_empty,
        'f-logic-errors': p.logic_errors, 'f-logic-triggers': p.logic_triggers, 'f-logic-anim': p.logic_anim,
        'f-logic-sync': p.logic_sync, 'f-logic-roles': p.logic_roles,
        't-front': p.frontend_stack, 't-back': p.tech_backend, 't-style': p.style_stack, 't-auth': p.tech_auth, 't-apis': p.tech_apis,
        'f-schema': p.db_schema, 'f-db-policies': p.db_policies,
        'f-git': p.github_url, 'f-supabase': p.supabase_config, 'f-vercel': p.vercel_url,
        'f-mvp': p.mvp_scope, 'f-roadmap-v2': p.roadmap_v2
    };
    for (let id in f) { const el = document.getElementById(id); if (el) el.value = f[id] || ''; }
    renderUXGallery();
}
