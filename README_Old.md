# 🐳 ORCA — Orchestrator Catalog Application (VERSÃO ANTERIOR)

> ⚠️ **Documento legado**: este README descreve a versão anterior do ORCA e **não reflete** o estado atual do repositório.

> Plataforma corporativa de **Catálogo de Serviços** focada em **UX fluida**, **formulários dinâmicos**, **integrações com AWX/OO**, **RBAC via LDAP** e **histórico de execuções**.  
> O ORCA centraliza a descoberta, a solicitação e a orquestração de automações com governança e segurança.

---

## 🎯 Objetivos

* **Criadores de ofertas:** Definem formulários (JSON Schema) e mapeiam respostas para payloads AWX/OO de forma visual.
* **Usuários:** Jornada simplificada para solicitar e acompanhar o status de automações em tempo real.
* **Segurança:** RBAC robusto baseado em grupos do **Windows AD (via LDAP)**.
* **Arquitetura:** Microserviços em .NET 8+, Clean Architecture e mensageria.

---

## 👥 Atores e Permissões

### 1) Usuário Solicitante (Requester)
* Acessa apenas ofertas permitidas pelas suas roles.
* As permissões são resolvidas via **LDAP no momento do login** e mantidas em cache para a sessão.
* Acompanha o histórico e status das solicitações.

### 2) Administrador de Catálogo (Admin/Publisher)
* **Formulários:** Cria schemas dinâmicos (Draft/Published) usando JSON Schema.
* **Execution Template (Configuração do Alvo):**
    * Define se o alvo é **AWX** (Job Template ou Workflow) ou **OO**.
    * Configura credenciais de serviço (Basic Auth).
* **Mapeamento Visual de Payload:**
    * Interface para relacionar chaves do payload com:
        1.  **Campos do Formulário**: Seleção dinâmica baseada no formulário publicado.
        2.  **Contexto do Sistema**: Campos automáticos (ex: `requester_login`).
        3.  **Parâmetros Fixos**: Valores estáticos definidos manualmente que não dependem do formulário.

---

## 🏗️ Arquitetura — Visão Geral

* **API Gateway (YARP):** Validação OIDC e roteamento de tráfego.
* **Identity/RBAC Service:** No ato do login, consulta o **Windows AD via LDAP**, resolve os grupos do usuário e mapeia para as Roles internas do ORCA.
* **Orchestrator Service:** * Processa o mapeamento de dados e dispara chamadas REST (Basic Auth) para AWX/OO.
    * **Monitoramento:** Realiza **polling de 5 em 5 segundos** para atualizar o status da execução.
* **BFF (Backend for Frontend):** Consolida dados dos serviços e gerencia notificações em tempo real (SignalR).

---

## 🔄 Fluxo de Execução

1.  **Solicitação:** Usuário preenche o formulário dinâmico e submete.
2.  **Preparação:** O Orchestrator monta o JSON final cruzando os dados do formulário + campos de sistema + campos fixos.
3.  **Disparo:** Realiza o POST para a API do AWX ou OO.
4.  **Tracking:** O sistema inicia um loop de verificação (polling de 5s) para atualizar o status da `Run`.
5.  **Feedback:** O usuário acompanha a mudança de status (Pending, Running, Success, Failed) no dashboard.

---

## 🧰 Stack Tecnológica

* **Frontend:** Next.js 14, Ant Design, Uniforms (JSON Schema rendering).
* **Backend:** .NET 8 (Minimal APIs), Entity Framework Core (PostgreSQL com JSONB).
* **Comunicação:** RabbitMQ (MassTransit) para fluxos assíncronos.
* **Integração:** Protocolo LDAP para resolução de grupos no login.

---

## 📂 Estrutura do Repositório (Destaque)

```text
src/
├── Gateway/       # YARP Gateway
├── Bff/           # Agregação para o Frontend
├── Identity/      # Lógica LDAP e Mapeamento de Roles
├── Catalog/       # Gestão de Ofertas e Visibilidade
├── Forms/         # Engine de JSON Schema
├── Orchestrator/  # Disparos, Mapping e Worker de Polling
└── Frontend/      # Next.js Application
```
## 🚀 Roadmap (Core MVP)

- [ ] **Auth & RBAC**: Login OIDC + Consulta LDAP (apenas no login) para resolução de grupos.
- [ ] **Designer de Mapeamento**: Interface UI para configurar o payload (Form Fields + System Fields + Fixed).
- [ ] **Engine de Orquestração**: Implementação do disparo Basic Auth e loop de Polling (5s).
- [ ] **History Dashboard**: Visualização de status e auditoria de solicitações.
