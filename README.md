# 🐳 ORCA — Plataforma de Orquestração e Catálogo de Serviços

> Plataforma corporativa de **Catálogo de Serviços** e **Orquestração de Automações** integrada com **AWX (Ansible)** e **OO (Operations Orchestration)**.  
> Oferece **UX fluida**, **formulários dinâmicos (JSON Schema)**, **retry inteligente com backoff exponencial**, **RBAC via LDAP**, **polling contínuo** e **rastreamento completo** de execuções.

---

## 🎯 Visão Geral

O ORCA é um sistema de **solicitação e execução de automações** onde:

1. **Admins** criam **ofertas** com **formulários dinâmicos** e configuram **como executar** em AWX/OO
2. **Usuários** solicitam execuções preenchendo os formulários
3. **Orchestrator** dispara automaticamente em AWX/OO e **monitora o progresso** (polling 5s)
4. **Retry automático** com backoff exponencial se falhar na primeira tentativa
5. **Bypass SSL** para ambientes com certificados inválidos
6. Usuários acompanham o status em **tempo real**

---

## 🏗️ Arquitetura — Microserviços

```
┌─────────────────────────────────────────────────────────────┐
│                     Frontend (Next.js)                       │
├─────────────────────────────────────────────────────────────┤
│                API Gateway (YARP) — Validação OIDC           │
├─────────────────────────────────────────────────────────────┤
│  Catalog   │  Forms   │  Identity  │ Requests │ Orchestrator │
│  Service   │ Service  │  Service   │ Service  │   Service    │
│  (Offers)  │ (Schemas)│  (LDAP)    │(Tracking)│ (AWX/OO)    │
└──────────────────────────────────────────────────────────────┘
        │        │          │            │            │
        └────────┴──────────┴────────────┴────────────┘
                         │
                    PostgreSQL + RabbitMQ
```

### 📦 Microserviços

| Serviço | Porta | Responsabilidade | Status |
|---------|-------|------------------|--------|
| **Catalog** | 5001 | Gestão de ofertas (CRUD, visibilidade, tags) | ✅ **Completo** |
| **Forms** | 5003 | Schemas JSON, versionamento, ExecutionTemplate (mapeamento) | ✅ **Completo** |
| **Identity** | 5002 | **Autenticação OIDC, LDAP, mapeamento dinâmico de roles** | ✅ **Completo** |
| **Requests** | 5004 | Gestão de solicitações, histórico, eventos | ✅ **Completo** |
| **Orchestrator** | 5005 | **Disparo em AWX/OO**, polling, retry com backoff, tracking | ✅ **Completo** |
| **SharedContracts** | — | Definições de eventos compartilhados (Message Contracts) | ✅ Disponível |
| **Frontend (Web)** | 3000 | Next.js - Dashboard, gerenciamento de ofertas e requisições | ✅ **Completo (MVP)** |

---

## 🔄 Fluxo Completo de Execução

### 1️⃣ Preparação (Admin)
```
Admin cria Offer → Admin cria FormDefinition (JSON Schema v1)
                → Admin publica FormDefinition
                → Admin cria ExecutionTemplate
                   (mapeamento: campos form → payload AWX/OO)
```

### 2️⃣ Solicitação (Usuário)
```
Usuário preenche formulário → POST /api/requests
                            → Cria Request (status=Pending)
                            → Publica RequestCreatedEvent
```

### 3️⃣ Orquestração (Orchestrator)
```
Recebe RequestCreatedEvent
                    ↓
Cria JobExecution (status=pending)
                    ↓
Prepara payload (form fields + sistema + fixos)
                    ↓
HTTP POST para AWX/OO
         ↓                    ↓
      SUCESSO            FALHA (rede, SSL, etc)
         ↓                    ↓
Salva AwxOoJobId      LaunchAttempts++
Muda para "running"   Agenda retry (5s, 10s, 20s...)
Publica evento        Muda para "retry_pending"
         ↓                    ↓
        5s depois         Próxima tentativa
   Inicia polling       (máx 5 tentativas)
```

### 4️⃣ Polling (PollingWorker — a cada 5s)
```
Para cada JobExecution em "running" ou "retry_pending":

SE "retry_pending":
   ├─ Se NextLaunchAttemptAtUtc <= now:
   │  └─ Tenta relançar SendToAwxOoAsync()
   └─ Se LaunchAttempts >= MaxAttempts:
      └─ Marca como "failed" + publica evento

SE "running":
   ├─ HTTP GET para consultar status em AWX/OO
   ├─ Atualiza AwxOoExecutionStatus
   └─ Se status é "successful" ou "COMPLETED":
      └─ Marca como "success" + publica evento
```

### 5️⃣ Feedback (Requests)
```
Recebe RequestStatusUpdatedEvent
                    ↓
Atualiza Request (status=Running/Success/Failed)
                    ↓
Usuário vê atualização no dashboard
```

---

## 🛠️ Recursos Principais

### ✅ SSL Bypass (Certificados Inválidos)
Para ambientes com certificados auto-assinados:
```bash
# Ativar em dev/test
ExternalServices__AllowInvalidSsl=true podman-compose up -d
```

Configura `AllowInvalidSsl=true` em ambos `AwxClient` e `OoClient`.

---

### ✅ Retry Automático com Backoff Exponencial
Quando o disparo falha por rede, timeout ou erro transitório:

1. **1ª tentativa falha** → agenda 5s depois
2. **2ª tentativa falha** → agenda 10s depois
3. **3ª tentativa falha** → agenda 20s depois
4. **4ª tentativa falha** → agenda 40s depois
5. **5ª tentativa falha** → agenda 80s depois (máx 120s)
6. **5 tentativas esgotadas** → marca como `failed`

Configurável em `appsettings.json`:
```json
"Orchestrator": {
  "LaunchRetry": {
    "MaxAttempts": 5,
    "BaseDelaySeconds": 5,
    "MaxDelaySeconds": 120
  }
}
```

---

### ✅ Polling Contínuo
**PollingWorker** (BackgroundService) roda continuamente:
- Executa a cada **5 segundos**
- Máximo **1440 tentativas** = 2 horas de timeout
- Respeita intervalo: não consulta 2 vezes em menos de 5s
- Aguarda relançamento se em `retry_pending`

---

### ✅ Mapeamento Visual de Payload
Admin configura como os dados fluem:

```json
{
  "fieldMappings": [
    {
      "payloadFieldName": "username",
      "sourceType": 0,  // 0=FormField, 1=SystemField, 2=Fixed
      "sourceValue": "email"  // Campo do form
    },
    {
      "payloadFieldName": "role",
      "sourceType": 2,  // Fixed
      "sourceValue": "Admin"  // Valor estático
    }
  ]
}
```

---

## 📊 Modelo de Dados (Principal)

### JobExecution (Orchestrator)
Representa **uma execução em AWX/OO**:

```csharp
public class JobExecution
{
    public Guid Id { get; set; }
    public Guid RequestId { get; set; }           // FK para Request
    
    // Alvo
    public int ExecutionTargetType { get; set; } // 0=AWX, 1=OO
    public string ExecutionResourceId { get; set; } // Template ID ou Flow UUID
    
    // Status
    public string ExecutionStatus { get; set; }  // pending/running/retry_pending/success/failed
    public string? AwxOoJobId { get; set; }      // ID da execução remota
    public string? AwxOoExecutionStatus { get; set; } // Status raw (successful, COMPLETED, etc)
    
    // Retry
    public int LaunchAttempts { get; set; }      // 0-5
    public DateTime? NextLaunchAttemptAtUtc { get; set; }
    public string? LastLaunchError { get; set; }
    
    // Polling
    public int PollingAttempts { get; set; }     // 0-1440
    public DateTime? LastPolledAtUtc { get; set; }
    
    // Auditoria
    public string? ExecutionPayload { get; set; } // JSON enviado
    public string? ExecutionResponse { get; set; } // JSON recebido
    public DateTime? CompletedAtUtc { get; set; }
    public string? ErrorMessage { get; set; }
}
```

### Request (Requests)
Rastreia a **solicitação de um usuário**:

```csharp
public class Request
{
    public Guid Id { get; set; }
    public Guid OfferId { get; set; }           // Qual serviço foi solicitado
    public Guid FormDefinitionId { get; set; }  // Qual formulário foi preenchido
    public string UserId { get; set; }          // Quem solicitou
    public string FormData { get; set; }        // JSON com respostas
    public RequestStatus Status { get; set; }   // Pending/Running/Success/Failed
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
}
```

---

## 🔌 Eventos Compartilhados

### RequestCreatedEvent (Requests → Orchestrator)
Publicado quando usuário cria solicitação:
```csharp
public record RequestCreatedEvent
{
    public Guid RequestId { get; init; }
    public Guid OfferId { get; init; }
    public Guid FormDefinitionId { get; init; }
    public int ExecutionTargetType { get; init; } // 0=AWX, 1=OO
    public string ExecutionResourceId { get; init; }
    public string UserId { get; init; }
    public string FormData { get; init; }        // JSON
    public DateTime CreatedAtUtc { get; init; }
}
```

### RequestStatusUpdatedEvent (Orchestrator → Requests)
Publicado quando status muda:
```csharp
public record RequestStatusUpdatedEvent
{
    public Guid RequestId { get; init; }
    public int Status { get; init; }                 // 1=Running, 2=Success, 3=Failed
    public int? ResultType { get; init; }           // Para OO: 0=RESOLVED, 1=DIAGNOSED, 2=NO_ACTION_TAKEN
    public string? AwxOoExecutionStatus { get; init; }
    public string? ExecutionId { get; init; }
    public string? ErrorMessage { get; init; }
    public DateTime UpdatedAtUtc { get; init; }
}
```

---

## 🧰 Stack Tecnológica

### Backend
- **.NET 8** — Linguagem runtime
- **Entity Framework Core 8** — ORM
- **PostgreSQL 16** — Banco (com JSONB)
- **MassTransit 8.1** — Message bus pattern
- **RabbitMQ 3** — Message broker
- **Polly 8.2** — Retry policies (exponential backoff)
- **FluentValidation** — DTOs
- **Swagger/OpenAPI** — Documentação

### Frontend
- **Next.js 16** — React framework
- **React 19** — UI runtime
- **Ant Design 6** — UI components
- **Tailwind CSS 4** — Styling
- **TanStack Query 5** — Server state
- **Zustand** — Client state

### DevOps
- **Docker/Podman** — Containerização
- **Compose (podman-compose)** — Orquestração local

---

## 📂 Estrutura do Repositório

```
ORCA/
├── README.md                          # Este arquivo
├── README_Old.md                      # Versão anterior do projeto
├── docker-compose.yml                 # Stack completa
├── dev.sh / SUMMARY.sh                # Scripts auxiliares
│
├── services/                          # Microserviços
│   ├── Orca.Catalog/                 # Service: Ofertas
│   ├── Orca.Forms/                   # Service: Schemas JSON + ExecutionTemplate
│   ├── Orca.Identity/                # Service: OIDC + LDAP + Roles
│   ├── Orca.Requests/                # Service: Solicitações + histórico
│   ├── Orca.Orchestrator/            # Service: AWX/OO + polling + retry
│   │   ├── Orca.Orchestrator.Api/
│   │   ├── Orca.Orchestrator.Application/
│   │   ├── Orca.Orchestrator.Domain/
│   │   └── Orca.Orchestrator.Infrastructure/
│   │
│   └── Orca.SharedContracts/         # Eventos compartilhados
│       └── Events/
│           ├── RequestCreatedEvent.cs
│           └── RequestStatusUpdatedEvent.cs
│
├── orca-web/                          # Frontend Next.js
│   ├── src/
│   │   ├── app/
│   │   ├── components/
│   │   └── services/
│   └── package.json
│
└── tests/                             # Testes unitários/integração
```

---

## 🚀 Como Executar

### ✅ Com Compose (Recomendado)

```bash
cd /home/danielbachiega/Documentos/ORCA

# Build de todas as imagens
podman-compose build --no-cache

# Subir stack completa
podman-compose up -d

# Conferir logs
podman-compose logs -f orchestrator-api

# Parar tudo
podman-compose down
```

**Endpoints disponíveis:**
- Catalog: http://localhost:5001/swagger
- Identity: http://localhost:5002/swagger 
- Forms: http://localhost:5003/swagger
- Requests: http://localhost:5004/swagger
- Orchestrator: http://localhost:5005/swagger 
- Frontend: http://localhost:3000
- RabbitMQ: http://localhost:15672 (guest/guest)

---

## 🔐 Primeiro Login (SuperAdmin)

O Identity Service já vem com um **usuário administrativo padrão**:

| Campo | Valor |
|-------|-------|
| Username | `superadmin` |
| Email | `admin@orca.local` |
| Roles | Admin (todos os acessos) |
| Grupos LDAP | Admins |

**Como fazer login:**

```bash
# Gere um JWT mock válido em https://jwt.io com:
# {
#   "preferred_username": "superadmin",
#   "email": "admin@orca.local",
#   "sub": "superadmin"
# }

curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"idToken": "seu-jwt-aqui"}'
```

Você receberá um `sessionToken` para usar nas próximas requisições.

### ✅ LDAP real + contas locais (superadmin/admin)
Se você quiser manter o LDAP real sempre ativo, deixe `LDAP_USE_MOCK_MODE=false`.

Para permitir que `superadmin` e `admin` continuem autenticando **mesmo com LDAP real**, configure as senhas locais via variáveis de ambiente (podman-compose):

- `LOCAL_SUPERADMIN_PASSWORD`
- `LOCAL_ADMIN_PASSWORD`

Se essas variáveis estiverem vazias, o fallback local fica desativado e o login desses usuários só funcionará se existirem no AD.

📖 **Documentação completa:** [services/Orca.Identity/README.md](services/Orca.Identity/README.md)

### ✅ Localmente (Desenvolvimento)

```bash
# Catalog
cd services/Orca.Catalog/Orca.Catalog.Api
dotnet run

# Forms (terminal novo)
cd services/Orca.Forms/Orca.Forms.Api
dotnet run

# ... etc
```

**Requisitos:**
- .NET 8 SDK
- PostgreSQL 16 rodando
- RabbitMQ rodando

---

## 🧪 Cenários de Teste

### 1️⃣ Criar uma Oferta
```bash
curl -X POST http://localhost:5001/api/offers \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "user-provision",
    "name": "User Provisioning",
    "description": "Criar usuário no AD",
    "tags": ["ldap", "onboarding"]
  }'
```

### 2️⃣ Criar FormDefinition
```bash
curl -X POST http://localhost:5003/api/form-definitions \
  -H "Content-Type: application/json" \
  -d '{
    "offerId": "<OFFER_ID>",
    "version": 1,
    "schemaJson": "{\"title\": \"Form\", \"fields\": [...]}",
    "isPublished": false
  }'
```

### 3️⃣ Criar ExecutionTemplate (AWX)
```bash
curl -X POST http://localhost:5003/api/execution-templates \
  -H "Content-Type: application/json" \
  -d '{
    "formDefinitionId": "<FORM_ID>",
    "targetType": 0,
    "resourceType": 0,
    "resourceId": "12345",
    "fieldMappings": [
      {"payloadFieldName": "email", "sourceType": 0, "sourceValue": "email"}
    ]
  }'
```

### 4️⃣ Criar Solicitação (Usuário)
```bash
curl -X POST http://localhost:5004/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "offerId": "<OFFER_ID>",
    "formDefinitionId": "<FORM_ID>",
    "userId": "user@example.com",
    "formData": "{\"email\": \"newuser@example.com\", \"department\": \"ti\"}"
  }'
```

### 5️⃣ Monitorar Execução
```bash
# Ver JobExecutions pendentes
curl http://localhost:5005/api/job-executions

# Ver detalhes de uma execução
curl http://localhost:5005/api/job-executions/{id}

# Ver logs do Orchestrator
podman logs -f orca-orchestrator-api | grep -E "(retry|Relançando|Agendando)"
```

---

## 🔍 Troubleshooting

### SSL Certificate Error
**Sintoma:** `Handshake failure` ou `unable to verify first certificate`

**Solução:**
```bash
ExternalServices__AllowInvalidSsl=true podman-compose up -d
```

Ou em `appsettings.json`:
```json
"ExternalServices": {
  "AllowInvalidSsl": true
}
```

---

### Retry não acontece
**Sintoma:** `ExecutionStatus=failed` imediatamente

**Verificar:**
```bash
# Ver logs
podman logs orca-orchestrator-api | grep "SendToAwxOoAsync"

# Checar banco
podman exec orca-postgres psql -U orca -d orca_orchestrator -c \
  "SELECT \"LaunchAttempts\", \"ExecutionStatus\" FROM \"JobExecutions\" 
   WHERE \"ExecutionStatus\"='retry_pending' LIMIT 3;"
```

---

### PollingWorker não roda
**Verificar:**
```bash
podman logs orca-orchestrator-api | grep "PollingWorker"
```

---

## 📚 Documentação Detalhada

Cada serviço tem seu próprio README com detalhes específicos:

- [Orca.Catalog](services/Orca.Catalog/README.md) — CRUD de ofertas
- [Orca.Forms](services/Orca.Forms/README.md) — Schemas JSON e mapeamento
- [Orca.Identity](services/Orca.Identity/README.md) — OIDC, LDAP, RBAC
- [Orca.Requests](services/Orca.Requests/README.md) — Solicitações e histórico
- [Orca.Orchestrator](services/Orca.Orchestrator/README.md) — **Disparo, polling, retry**
- [Orca.SharedContracts](services/Orca.SharedContracts/README.md) — Message contracts

---

## 🔗 Integração com AWX/OO

### AWX (Ansible Automation Platform)

**Disparar:**
```http
POST https://awx.example.com/api/v2/job_templates/{id}/launch/
Authorization: Basic base64(username:password)
Content-Type: application/json

{
  "extra_vars": {
    "email": "newuser@example.com",
    "department": "ti"
  }
}
```

**Resposta:** `{"id": 98765, "status": "pending"}`

**Consultar status:**
```http
GET https://awx.example.com/api/v2/jobs/{id}/
Authorization: Basic base64(username:password)
```

---

### OO (Operations Orchestration)

**Disparar:**
```http
POST https://oo.example.com/executions
Authorization: Basic base64(username:password)
Content-Type: application/json

{
  "flowUuid": "c1234567-89ab-cdef-0123-456789abcdef",
  "inputs": {"email": "newuser@example.com"}
}
```

**Resposta:** `12345678901` (string numérico)

**Consultar status:**
```http
GET https://oo.example.com/executions/{id}/execution-log
Authorization: Basic base64(username:password)
```

---

## 🎓 Conceitos Chave

### Clean Architecture
Cada serviço segue o padrão:
- **Domain** — Entidades e contratos
- **Application** — Casos de uso, DTOs, validação
- **Infrastructure** — EF Core, HTTP clients, banco
- **Api** — Controllers, dependências

### Event-Driven
Serviços se comunicam via **MassTransit + RabbitMQ**:
- Desacoplamento de tempo
- Escalabilidade horizontal
- Retry automático de mensagens

### RBAC Dinâmico
Roles mapeadas de **grupos AD** no login:
- Sem hardcode
- Sincronizado com Active Directory
- Configurável via admin UI

---

## 📄 Licença

Propriedade privada. Uso interno apenas.

---

## 🤝 Contribuindo

1. Faça checkout de `develop`
2. Crie branch: `git checkout -b feat/sua-feature`
3. Commit com conventional commits
4. Push e abra PR para `develop`

---

## 🆘 Suporte

Para dúvidas ou problemas:
1. Verifique os READMEs específicos de cada serviço
2. Consulte a documentação Swagger (`/swagger`)
3. Verifique os logs: `podman logs -f <container>`
4. Inspecione o banco: `psql -U orca -d orca_<service>`

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

* **API Gateway (YARP):** Planejado (não presente no repositório atual).
* **Identity/RBAC Service:** No ato do login, consulta o **Windows AD via LDAP**, resolve os grupos do usuário e mapeia para as Roles internas do ORCA.
* **Orchestrator Service:** * Processa o mapeamento de dados e dispara chamadas REST (Basic Auth) para AWX/OO.
    * **Monitoramento:** Realiza **polling de 5 em 5 segundos** para atualizar o status da execução.
* **BFF (Backend for Frontend):** Planejado (não presente no repositório atual).

---

## 🔄 Fluxo de Execução

1.  **Solicitação:** Usuário preenche o formulário dinâmico e submete.
2.  **Preparação:** O Orchestrator monta o JSON final cruzando os dados do formulário + campos de sistema + campos fixos.
3.  **Disparo:** Realiza o POST para a API do AWX ou OO.
4.  **Tracking:** O sistema inicia um loop de verificação (polling de 5s) para atualizar o status da `Run`.
5.  **Feedback:** O usuário acompanha a mudança de status (Pending, Running, Success, Failed) no dashboard.

---

## 🧰 Stack Tecnológica

* **Frontend:** Next.js 16, React 19, Ant Design 6, TanStack Query 5, Tailwind CSS 4.
* **Backend:** .NET 8 (Minimal APIs), Entity Framework Core (PostgreSQL com JSONB).
* **Comunicação:** RabbitMQ (MassTransit) para fluxos assíncronos.
* **Integração:** Protocolo LDAP para resolução de grupos no login.

---

## 📂 Estrutura do Repositório (Destaque)

```text
services/
├── Orca.Catalog/        # Gestão de ofertas
├── Orca.Forms/          # Schemas JSON + ExecutionTemplate
├── Orca.Identity/       # OIDC + LDAP + Roles
├── Orca.Requests/       # Solicitações + histórico
├── Orca.Orchestrator/   # Disparos, polling e retry
└── Orca.SharedContracts/# Eventos compartilhados

orca-web/                # Frontend Next.js
```
## 🚀 Roadmap (Core MVP)

- [x] **Auth & RBAC**: ✅ Login OIDC + Consulta LDAP + Mapeamento dinâmico de grupos → roles (Clean Architecture)
- [x] **Designer de Mapeamento**: ✅ Interface UI para configurar payload (Form Fields + System Fields + Fixed)
- [x] **Engine de Orquestração**: ✅ Implementação do disparo Basic Auth e loop de Polling (5s) + Retry exponencial
- [x] **History Dashboard**: ✅ Visualização de status, auditoria e detalhes de solicitações
- [x] **Frontend MVP**: ✅ Dashboard, gerenciamento de ofertas, requisições, roles e perfil de usuário
- [x] **Session Persistence**: ✅ localStorage + getMe() para manter sessão ativa ao atualizar página
- [x] **Password Validation**: ✅ Backend valida credenciais via LDAP
- [x] **JSON Schema Editor**:  ✅ UI visual para criar/editar formulários

## 🚀 Próximos Passos (Phase 2)

- [ ] **Advanced Reporting**: Dashboards com métricas e trends
- [ ] **Webhook Support**: Notificações de status em tempo real via webhook
- [ ] **Multi-tenant**: Suporte para múltiplas organizações
- [ ] **API Documentation**: Auto-generated API docs com exemplos
- [ ] **Performance**: Cache distribuído com Redis, índices PostgreSQL