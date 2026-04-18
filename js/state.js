// Estado Global da Aplicação
let currentProject = null;
let allTasks = [];
let allProjects = [];
let currentTask = null;
let saveTimeout = null;
let currentSlide = 0;

// Variáveis do Timer
let activeTimerInterval = null;
let activeTaskId = null;
let activeTaskSeconds = 0;
