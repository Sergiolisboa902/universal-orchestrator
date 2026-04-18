# 🧠 Universal Orchestrator v12.1.2

Sistema Estratégico de Orquestração de Projetos (SPA Vanilla JS + Supabase).

## 🚀 Visão Geral
O **Universal Orchestrator** é uma ferramenta de gestão de projetos de alto nível, projetada para transformar ideias brutas em planos de ação executáveis. Ele combina um **Blueprint 360** (planejamento profundo) com um **Kanban dinâmico** e um **Motor de IA** para geração de prompts contextuais.

---

## 📂 Arquitetura de Arquivos

| Arquivo | Função | Descrição Técnica |
| :--- | :--- | :--- |
| `index.html` | **Interface (UI)** | Estrutura SPA que contém todas as telas, modais e containers do sistema. |
| `app.js` | **Lógica (Cérebro)** | Gerencia a persistência no Supabase, lógica do Kanban, Motor de IA e Auto-save. |
| `style.css` | **Estética (UX)** | Define a identidade visual "Cyber/Tech", layout responsivo e animações. |
| `config.js` | **Configuração** | *Backup* das chaves de API. (Nota: As chaves estão unificadas no `app.js` para estabilidade). |
| `vercel.json` | **Deploy** | Configurações de roteamento e headers para hospedagem na Vercel. |
| `.gitignore` | **Segurança** | Impede que arquivos sensíveis (como `.env.local`) sejam enviados ao GitHub. |
| `.project_root`| **Marcador** | Identifica a raiz do projeto para ferramentas de IA e automação. |

---

## 🛠️ Funcionalidades Chave

1. **Blueprint 360:** 7 seções de planejamento cobrindo desde Fundamentos até o Escopo do MVP.
2. **IA Engine 3.0:** Geração de prompts especializados (Código, Business, Debug) com contexto completo do projeto.
3. **Métricas Dinâmicas:** Dashboard que calcula o progresso real baseado nas tarefas concluídas.
4. **Pitch Deck:** Gerador automático de slides para apresentação do projeto.
5. **Auto-save:** Sincronização em tempo real com o Supabase para evitar perda de dados.

---

## 📈 Log de Evolução

### v12.1.2 (Atual)
- **Correção de Crash:** Unificação das chaves de configuração no `app.js` para evitar erro de carregamento online.
- **Estabilidade:** Adicionado tratamento de erros visual na tela de carregamento.

### v12.1.1
- **Métricas:** Implementação do Dashboard de progresso por categoria.
- **Exportação:** Adicionada função para baixar o Blueprint em Markdown (.md).
- **IA Refinada:** Adicionados modos de prompt específicos (Code, Business, Debug).

### v12.1.0
- **Base:** Estrutura inicial com Kanban e Blueprint integrado ao Supabase.

---

## 🛠️ Como rodar
1. **Local:** Abra o `index.html` em qualquer navegador.
2. **Online:** O projeto está configurado para deploy automático na Vercel via GitHub.

---
*Documentação gerada e atualizada pelo Gemini CLI.*
