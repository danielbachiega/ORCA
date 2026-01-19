 # 🐳 ORCA — Orchestrator Catalog Application

> Plataforma corporativa de **Catálogo de Serviços** focada em **UX fluida**, **formulários dinâmicos**, **integrações com AWX/OO**, **RBAC com Windows AD** e **histórico de solicitações/execuções**.  
> O ORCA centraliza a descoberta, a solicitação e a orquestração de automações com governança e escalabilidade.

---

## 🎯 Objetivos

- Permitir que **criadores de ofertas** definam **formulários customizados** (JSON Schema + regras condicionais) e mapeiem respostas para **payloads AWX/OO**.
- Oferecer ao **usuário solicitante** uma jornada simples para **ver**, **solicitar** e **acompanhar** ofertas às quais tem acesso.
- Controlar a visibilidade por **RBAC** baseado em **roles** vinculadas a **grupos do Windows AD**.
- Manter **histórico de solicitações e execuções**, com status em tempo quase real e auditoria.
- Adotar **boas práticas**: microserviços, Clean Architecture, mensageria, observabilidade, segurança corporativa (AAD), containers e Kubernetes.

---

## 👥 Atores e Permissões

### 1) Usuário Solicitante (Requester)
- **Vê** apenas as ofertas vinculadas às **roles** para as quais ele tem pertença via **grupo no Windows AD**.
- **Solicita** ofertas disponíveis.
- **Acompanha** o status das execuções (tempo real) e **consulta o histórico** de pedidos anteriores.

### 2) Administrador de Catálogo (Admin/Publisher)
- **Cria** e **edita** formulários (JSON Schema, UI schema, regras condicionais).
- **Publica**/despublica ofertas (versionando schema e mapeamentos).
- **Define roles da aplicação** e **vincula cada role a um ou mais grupos do Windows AD**.
- **Configura a visibilidade** das ofertas associando **roles** (logo, toda pessoa em grupos AAD vinculados àquela role verá a oferta).
- **Gerencia** mappings para AWX/OO, auditoria e governança.

> **Modelo de RBAC**  
> - **App Roles (ORCA)**: criadas e geridas no contexto da aplicação.  
> - **Vínculo Role ↔ Grupos AAD**: cada role do ORCA aponta para um ou mais **Group Object IDs** no Windows AD.  
> - **Oferta ↔ Roles**: uma oferta é visível/executável para usuários que possuam qualquer uma das roles associadas (via pertença aos grupos AAD vinculados).

---

## 🏗️ Arquitetura — Visão Geral

- **API Gateway (YARP)**  
  - OIDC com **Windows AD (Entra ID)**: valida tokens, aplica policies e roteia.
  - Propaga identidade/claims por cabeçalhos confiáveis (`x-user-oid`, `x-user-upn`, `x-user-groups`, `x-correlation-id`).

- **BFF (Backend for Frontend)**  
  - Agrega dados e simplifica contratos para o Frontend.

- **Microserviços ORCA**
  - **Catalog Service**: ofertas (draft/published), versionamento, visibilidade por roles.
  - **Forms Service**: armazenamento de **FormDefinition** (JSON Schema, UI schema, regras).
  - **Orchestrator Service**: mapeamento de respostas → **AWX/OO**, disparo e tracking.
  - **Requests/History Service**: solicitações, execuções, status, auditoria.
  - **Identity/RBAC Service**: gestão de **roles do ORCA** e **vínculo com grupos do AAD**; resolução de visibilidade.
 
- **Mensageria**: RabbitMQ (eventos assíncronos, outbox, DLQ).
- **Bancos**: PostgreSQL (JSONB), Redis (cache).
- **Frontend**: Next.js + Ant Design + Uniforms (render dinâmico de JSON Schema).
- **Observabilidade**: OpenTelemetry (traces, métricas, logs).

---

## 🧰 Stack Tecnológica

**Frontend**
- Next.js (TypeScript), Ant Design, Uniforms (+ `uniforms-antd`)
- TanStack Query, MSAL (Windows AD), SignalR

**Backend (.NET 8+)**
- ASP.NET Core Minimal APIs, EF Core (Npgsql), FluentValidation
- MassTransit (RabbitMQ), Polly, Refit, AutoMapper
- OpenTelemetry, YARP

**Infra**
- Docker/Compose, Kubernetes (Ingress + TLS), Key Vault/Secrets
- Prometheus/Grafana, ELK/OpenSearch

---

## 📂 Estrutura do Repositório (proposta)

```
/
├─ deploy/
│  ├─ compose/
│  └─ k8s/
├─ docs/
├─ src/
│  ├─ Gateway/
│  ├─ Bff/
│  ├─ Catalog/
│  │  ├─ Catalog.Domain/
│  │  ├─ Catalog.Application/
│  │  ├─ Catalog.Infrastructure/
│  │  └─ Catalog.Api/
│  ├─ Forms/
│  │  ├─ Forms.Domain/
│  │  ├─ Forms.Application/
│  │  ├─ Forms.Infrastructure/
│  │  └─ Forms.Api/
│  ├─ Orchestrator/
│  │  ├─ Orchestrator.Domain/
│  │  ├─ Orchestrator.Application/
│  │  ├─ Orchestrator.Infrastructure/
│  │  └─ Orchestrator.Api/
│  ├─ Requests/
│  │  ├─ Requests.Domain/
│  │  ├─ Requests.Application/
│  │  ├─ Requests.Infrastructure/
│  │  └─ Requests.Api/
│  └─ Frontend/
└─ tests/
```

**Padrão por serviço (Clean Architecture)**  
- `Domain` → Entidades, Value Objects, interfaces, eventos.  
- `Application` → Casos de uso, DTOs, validações.  
- `Infrastructure` → EF Core/Migrations, brokers, repositórios, adapters.  
- `Api` → Endpoints, DI, Autorização/Policies.

---

## 🔐 Segurança, Identidade e RBAC

### Autenticação (Windows AD)
- Fluxo **Authorization Code + PKCE** no Front.
- Gateway valida JWT e injeta cabeçalhos confiáveis (`x-user-oid`, `x-user-upn`, `x-user-groups`, `x-correlation-id`).

### Autorização
- **Roles do ORCA** (no contexto do app) definidas pelo Admin.
- **Vínculo Role ↔ Grupos AAD** (por **Object ID**). Exemplo:
  ```json
  {
    "roleName": "CATALOG_REQUESTER_COMPUTE",
    "aadGroups": [
      "11111111-1111-1111-1111-111111111111",
      "22222222-2222-2222-2222-222222222222"
    ]
  }
  ```
- **Oferta ↔ Roles**: cada oferta inclui a lista de roles autorizadas:
  ```json
  {
    "offerId": "GUID",
    "visibleToRoles": ["CATALOG_REQUESTER_COMPUTE", "CATALOG_REQUESTER_STORAGE"]
  }
  ```
- **Resolução de acesso**: o serviço de Identity/RBAC resolve, para o usuário logado (via `groups` claim do AAD), quais **roles** do ORCA ele efetivamente possui (por vínculo Role↔Group). A partir das roles resolvidas, o Catalog devolve apenas as ofertas compatíveis.

---

## 🗃️ Modelo de Dados (simplificado)

**roles** (ORCA)
- `id`, `name` (ex.: `CATALOG_REQUESTER_COMPUTE`)
- `aad_groups (jsonb)` → array de Object IDs de grupos AAD

**offers**
- `id`, `name`, `description`, `category`, `status (draft|published)`, `version`
- `visible_to_roles (jsonb)` → array de nomes de roles do ORCA
- `created_by`, `created_at`

**form_definitions**
- `id`, `offer_id`, `version`
- `json_schema (jsonb)`, `ui_schema (jsonb)`, `rules (jsonb)`

**execution_templates**
- `id`, `offer_id`, `target_system (awx|oo)`, `external_identifier`
- `payload_mapping (jsonb)` (JSONPath)

**requests**
- `id`, `offer_id`, `form_version`, `requester_oid`, `requester_upn`
- `answers (jsonb)`, `status`, timestamps

**runs**
- `id`, `request_id`, `target_system`, `external_run_id`
- `status`, `logs_url`, timestamps

**audit_logs**, **outbox_messages**

---

## 🔄 Fluxos Essenciais

### (Admin) Criar ofertas e configurar RBAC
1. **Criar Role do ORCA** e **vincular** a grupos do AAD (um ou mais).
2. **Criar Oferta** em **draft**.
3. Definir **FormDefinition** (JSON Schema + UI schema + regras condicionais).
4. Definir **ExecutionTemplate** (AWX/OO + `payload_mapping` via JSONPath).
5. Associar **visible_to_roles** na oferta.
6. **Publicar** a oferta (versionamento).

### (Requester) Solicitar e acompanhar
1. Usuário loga (AAD) e o sistema **resolve roles** via grupos AAD.
2. Usuário vê **apenas** as ofertas com roles compatíveis.
3. Preenche formulário dinâmico (condições).
4. Submete → cria **Request** e emite `StartExecution`.
5. **Orchestrator** aplica mapping e dispara **AWX/OO**.
6. **Runs** são gravadas e status é atualizado (webhook/polling).
7. Usuário acompanha em **Meu Histórico** (SignalR/polling).

---

## 🧪 Qualidade e Boas Práticas

- **Clean Architecture** e **DDD leve**.
- **Outbox & DLQ** para consistência e resiliência.
- **Polly** (retries/circuit breaker) em integrações.
- **OpenTelemetry**: tracing distribuído, métricas e logs estruturados.
- **Idempotência** por `RequestId` nas chamadas AWX/OO.
- **Validação**: AJV (front) + validação server-side (FluentValidation/Schema).

---

## 🚀 Como Rodar (Dev)

Pré-requisitos:
- Docker & Docker Compose
- Node 18+ / PNPM (ou NPM/Yarn)
- .NET SDK 8+

```bash
# 1) Variáveis (ajuste .env)
cp deploy/compose/.env.example deploy/compose/.env

# 2) Subir stack
docker compose -f deploy/compose/docker-compose.yml up -d --build

# 3) Frontend
cd src/Frontend
pnpm install
pnpm dev  # ou npm run dev
```

**Windows AD (local)**: configure **Redirect URIs** para `http://localhost:3000` e callback do MSAL.

---

## 🔭 Roadmap

**MVP**
- Login AAD, resolução de roles via grupos AAD
- Catálogo com visibilidade por **visible_to_roles**
- Form builder (JSON Schema + regras)
- Execução via **AWX**
- Histórico (requests + runs) com status
- Upload de imagem da oferta (substituir URL por upload persistido no banco)

**Evolução**
- Integração **OO**
- Admin de Roles (UI) + vínculo com grupos AAD
- Notificações (Teams/Email)
- Auditoria avançada (consulta e export)
- Templates de mapeamento reutilizáveis
- Feature Flags

---

## 📖 Glossário

- **Role (ORCA)**: papel lógico da aplicação, vinculado a grupos AAD.
- **Grupo (AAD)**: entidade do Windows AD; pertença define roles do ORCA.
- **Oferta**: item publicável/solicitável do catálogo.
- **FormDefinition**: schema declarativo do formulário (JSON Schema + regras).
- **ExecutionTemplate**: mapeamento das respostas para payload AWX/OO.
- **Request**: solicitação feita por um usuário.
- **Run**: execução concreta no alvo (AWX/OO).
