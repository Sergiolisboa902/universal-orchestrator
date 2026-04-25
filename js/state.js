// Universal Orchestrator - Global State Centralizado
// Todas as variáveis de estado devem ser declaradas aqui para acesso global.

let _supabase = null;
let currentProject = null;
let allTasks = [];
let allProjects = [];
let currentTask = null;
let saveTimeout = null;
let currentSlide = 0;

// Variáveis do Cronômetro (Timer)
let activeTimerInterval = null;
let activeTaskId = null;
let activeTaskSeconds = 0;

// Variáveis de Documentação (Obsidian/Knowledge Base)
let allDocs = [];
let currentDoc = null;
let docSaveTimeout = null;
