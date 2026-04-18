# 🧠 Universal Orchestrator v12.1.3

Sistema Estratégico de Orquestração de Projetos (SPA Vanilla JS + Supabase + Agente Local).

## 🚀 Visão Geral
O **Universal Orchestrator** é uma "Torre de Controle" estratégica para múltiplos projetos. Ele combina planejamento profundo (**Blueprint 360**), gestão ágil (**Kanban**) e um ecossistema de dados bi-direcional que conecta a Web diretamente ao sistema de arquivos do seu computador.

---

## 📂 Arquitetura do Sistema

| Arquivo | Função | Descrição Técnica |
| :--- | :--- | :--- |
| `index.html` | **Interface (UI)** | Estrutura SPA com dashboard, kanban e guia de setup integrado. |
| `app.js` | **Lógica (Cérebro)** | Gerencia Supabase, Motor de IA, Métricas e ordens de provisionamento. |
| `provision-server.js` | **Agente Local** | Servidor Node.js (Porta 3000) que cria pastas e inicia o Git fisicamente. |
| `sync-orchestrator.js`| **Ponte de Dados** | Script CLI para sincronizar a memória da IA local com o banco de dados. |
| `style.css` | **Estética (UX)** | Design "Cyber/Tech" responsivo com animações e centralização de cards. |
| `README.md` | **Documentação** | Este guia de arquitetura e evolução. |

---

## 🛠️ Funcionalidades de Elite

1. **Criação Conectada:** Inicie projetos já vinculando GitHub, Vercel e Supabase no nascimento.
2. **Provisionamento Local:** O Orquestrador web envia comandos para o seu PC criar pastas e rodar `git init` automaticamente.
3. **IA Engine 3.0:** Geração de prompts especializados com contexto bi-direcional (IA lê e escreve no seu Kanban).
4. **Métricas de Progresso:** Dashboard em tempo real com saúde do projeto por categorias.
5. **Auto-Doc:** Exportação do planejamento estratégico para Markdown (.md).

---

## ⚙️ Como Configurar o Ecossistema Local

Para que o Orquestrador consiga criar pastas no seu computador:

1. **Inicie o Agente Local:**
   ```bash
   node provision-server.js
   ```
2. **Sincronize a Memória da IA:**
   ```bash
   node sync-orchestrator.js --sync "Nome do Projeto"
   ```

---

## 📈 Log de Evolução

### v12.1.3 (Atual)
- **Criação Conectada:** Novos campos de Infra (Git, Vercel, Supabase) no modal inicial.
- **Auto-Git:** Provisionamento local agora executa `git init` e configura o remoto automaticamente.
- **UX Didática:** Adicionado guia de setup e hints de ajuda no modal de criação.
- **Fix Visual:** Centralização dos cards de projeto e correção de corte no hover.

### v12.1.2 
- **Conectividade:** Unificação das chaves no `app.js` e estabilização do carregamento online.
- **Ponte IA:** Criado script de sincronização bi-direcional terminal/web.

---
*Documentação viva, atualizada pelo Gemini CLI.*
