# 🔄 Orca Orchestrator Service

Microserviço responsável pela **orquestração de execuções** em sistemas externos (AWX - Ansible Automation Platform e OO - Operations Orchestration). Gerencia todo o ciclo de vida de execuções, desde o disparo até a conclusão, com polling assíncrono e tratamento de status.

## 🎯 Responsabilidades

### Execution Orchestration
- **Consumir eventos** `RequestCreatedEvent` do RabbitMQ (publicados por Requests)
- **Criar registros de execução** (`JobExecution`) no banco
- **Disparar execuções** em AWX (via HTTP POST) ou OO (via HTTP POST)
- **Fazer polling** a cada 5 segundos para obter status
- **Mapear status** de AWX/OO para status local (Running/Success/Failed)
- **Publicar eventos** de atualização de status (`RequestStatusUpdatedEvent`) para o Requests

### Multi-Target Execution
- **AWX (Ansible):** JobTemplate ou Workflow - dispara e consulta status
- **OO (Operations Orchestration):** Flow UUID - dispara e consulta status + resultType
- **Bypass SSL** para ambientes com certificados inválidos (`AllowInvalidSsl`)
- **Retry inteligente** com exponential backoff (5s, 10s, 20s, 40s, 80s, máx 120s)
- **Máximo 5 tentativas** de launch antes de marcar como failed
- **Timeout automático** após 2 horas de polling (1440 tentativas de 5s)

### Polling Strategy
- **5 segundos** de intervalo entre consultas (respeitado via `LastPolledAtUtc`)
- **BackgroundService** (`PollingWorker`) que roda continuamente
- **Máximo 1440 tentativas** = 2 horas de timeout
- **State machine implícito:** pending → running → success/failed

## 📊 Modelo de Dados

### Entidade: JobExecution

```csharp
public class JobExecution
{
    public Guid Id { get; set; }
    public Guid RequestId { get; set; }              // FK para Request (rastreabilidade)
    public int ExecutionTargetType { get; set; }     // 0=AWX, 1=OO
    public int? ExecutionResourceType { get; set; }  // 0=JobTemplate, 1=Workflow (null para OO)
    public string ExecutionResourceId { get; set; }  // ID do job/workflow/flow
    public string ExecutionStatus { get; set; }      // pending/running/retry_pending/success/failed
    public string? AwxOoJobId { get; set; }          // ID retornado por AWX/OO
    public string? AwxOoExecutionStatus { get; set; }// Status original (new, pending, running, successful, failed, RUNNING, COMPLETED, SYSTEM_FAILURE)
    public int PollingAttempts { get; set; }         // Contador de tentativas de polling (0-1440)
    public DateTime? LastPolledAtUtc { get; set; }   // Última consulta de status
    public DateTime? CompletedAtUtc { get; set; }    // Quando terminou
    public string? ErrorMessage { get; set; }        // Se falhou, por quê?
    
    // Launch Retry
    public int LaunchAttempts { get; set; }          // Contador de tentativas de launch (0-5)
    public DateTime? NextLaunchAttemptAtUtc { get; set; } // Quando fazer próximo retry
    public string? LastLaunchError { get; set; }     // Último erro de launch
    
    // JSONB Storage
    public string? ExecutionPayload { get; set; }    // Request JSON enviado para AWX/OO
    public string? ExecutionResponse { get; set; }   // Response JSON recebido
    
    // Auditoria
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? SentToAwxOoAtUtc { get; set; }  // Quando foi disparado
}```
```

## 🏗️ Arquitetura (Clean Architecture)

```
Orca.Orchestrator/
├── Orca.Orchestrator.Api/
│   ├── Controllers/
│   │   └── JobExecutionsController.cs       # Endpoints para status
│   ├── Program.cs                            # DI + MassTransit + PollingWorker
│   ├── Dockerfile
│   └── appsettings.json
│
├── Orca.Orchestrator.Application/
│   ├── Clients/
│   │   ├── IExecutionClient.cs               # Abstração para AWX/OO
│   │   ├── Dtos/
│   │   │   ├── AwxLaunchRequest.cs
│   │   │   ├── AwxLaunchResponse.cs
│   │   │   ├── AwxJobStatusResponse.cs
│   │   │   ├── OoExecutionRequest.cs
│   │   │   └── OoExecutionLogResponse.cs
│   │
│   ├── JobExecutions/
│   │   ├── IJobExecutionService.cs           # Contrato
│   │   └── JobExecutionService.cs            # Lógica + polling
│   │
│   ├── Consumers/
│   │   └── RequestCreatedEventConsumer.cs    # MassTransit consumer
│   │
│   └── Workers/
│       └── PollingWorker.cs                  # BackgroundService (5s intervals)
│
├── Orca.Orchestrator.Domain/
│   ├── Entities/
│   │   └── JobExecution.cs                   # Entidade rica
│   └── Repositories/
│       └── IJobExecutionRepository.cs        # Contrato
│
└── Orca.Orchestrator.Infrastructure/
    ├── OrchestratorContext.cs                # DbContext (JSONB)
    ├── Repositories/
    │   └── JobExecutionRepository.cs         # Implementação
    ├── Clients/
    │   ├── AwxClient.cs                      # HTTP client para AWX
    │   └── OoClient.cs                       # HTTP client para OO
    ├── Migrations/
    │   └── 20260127234257_InitialCreate.cs
    └── Data/
```

## 🔌 Endpoints

### GET /api/job-executions
Lista todas as execuções com paginação.

**Query Parameters:**
- `page` (int, default: 1) - Número da página
- `pageSize` (int, default: 10) - Itens por página

**Response (200 OK):**
```json
{
  "items": [
    {
      "id": "b72af38d-ab5e-44a3-a568-584ffc46dd29",
      "requestId": "a62af38d-ab5e-44a3-a568-584ffc46dd28",
      "executionTargetType": 0,
      "awxOoJobId": "98765",
      "executionStatus": 2,
      "pollingAttempts": 24,
      "lastPolledAtUtc": "2026-01-27T19:15:30.120Z",
      "createdAtUtc": "2026-01-27T19:13:50.000Z",
      "completedAtUtc": "2026-01-27T19:15:35.500Z"
    }
  ],
  "total": 1,
  "page": 1,
  "pageSize": 10
}
```

**ExecutionStatus (int):**
- `0` = pending
- `1` = running
- `2` = success
- `3` = failed

---

### GET /api/job-executions/{id}
Obter detalhes completos de uma execução por ID.

**Response (200 OK):**
```json
{
  "id": "b72af38d-ab5e-44a3-a568-584ffc46dd29",
  "requestId": "a62af38d-ab5e-44a3-a568-584ffc46dd28",
  "executionTargetType": 0,
  "awxOoJobId": "98765",
  "executionStatus": 2,
  "resultStatusType": null,
  "pollingAttempts": 24,
  "maxPollingAttempts": 1440,
  "lastPolledAtUtc": "2026-01-27T19:15:30.120Z",
  "executionPayload": {
    "extra_vars": {
      "email": "user@example.com"
    }
  },
  "executionResponse": {
    "id": 98765,
    "status": "successful"
  },
  "errorMessage": null,
  "createdAtUtc": "2026-01-27T19:13:50.000Z",
  "completedAtUtc": "2026-01-27T19:15:35.500Z"
}
```

**Response (404 Not Found):**
```json
{
  "error": "JobExecution b72af38d-ab5e-44a3-a568-584ffc46dd29 not found"
}
```

---

### GET /api/job-executions/request/{requestId}
Obter todas as execuções de um Request específico.

**Response (200 OK):**
```json
[
  {
    "id": "b72af38d-ab5e-44a3-a568-584ffc46dd29",
    "requestId": "a62af38d-ab5e-44a3-a568-584ffc46dd28",
    "executionTargetType": 0,
    "awxOoJobId": "98765",
    "executionStatus": 2,
    "pollingAttempts": 24,
    "lastPolledAtUtc": "2026-01-27T19:15:30.120Z",
    "createdAtUtc": "2026-01-27T19:13:50.000Z",
    "completedAtUtc": "2026-01-27T19:15:35.500Z"
  }
]
```

**Response (200 OK - Vazio):**
```json
[]
```

## 🔄 Fluxo Completo (Event-Driven)

```
1. Requests publica RequestCreatedEvent no RabbitMQ
   ↓
2. Orchestrator.RequestCreatedEventConsumer consome evento
   ↓
3. Consumer chama JobExecutionService.CreateJobExecutionAsync()
   → Cria JobExecution com status="pending"
   ↓
4. Consumer chama JobExecutionService.SendToAwxOoAsync()
   → Prepara payload (extra_vars para AWX, inputs para OO)
   → HTTP POST para AWX/OO
   → SE SUCESSO: Salva executionId (AwxOoJobId), muda para "running"
   → SE FALHA: Agenda retry (LaunchAttempts++, muda para "retry_pending")
   ↓
5. PollingWorker inicia loop (a cada 5 segundos)
   
   5a. Para execuções "retry_pending":
       → Verifica se NextLaunchAttemptAtUtc <= now
       → Se sim e LaunchAttempts < MaxAttempts (5): relança SendToAwxOoAsync()
       → Se LaunchAttempts >= MaxAttempts: marca como "failed" e publica erro
   
   5b. Para execuções "running":
       → HTTP GET para consultar status em AWX/OO
       → Atualiza AwxOoExecutionStatus, PollingAttempts, LastPolledAtUtc
   ↓
6. Quando status muda para "successful" ou "COMPLETED"
   → JobExecutionService publica RequestStatusUpdatedEvent
   → Requests consome e atualiza status da requisição
   ↓
7. Se falhar ou timeout (1440 tentativas de polling ou 5 tentativas de launch)
   → Marca como "failed"
   → Publica RequestStatusUpdatedEvent com erro
   → Requests atualiza requisição como Failed
```

## 📨 Message Contracts

### RequestCreatedEvent (Consumer)
Recebido do Requests Service:

```csharp
public record RequestCreatedEvent
{
    public Guid RequestId { get; init; }
    public Guid OfferId { get; init; }
    public Guid FormDefinitionId { get; init; }
    public int ExecutionTargetType { get; init; }        // 0=AWX, 1=OO
    public int? ExecutionResourceType { get; init; }     // 0=JobTemplate, 1=Workflow
    public string ExecutionResourceId { get; init; }     // ID imutável do recurso
    public string UserId { get; init; }
    public string FormData { get; init; }                // JSON string com dados do formulário
    public DateTime CreatedAtUtc { get; init; }
}
```

### RequestStatusUpdatedEvent (Publisher)
Enviado para Requests Service:

```csharp
public record RequestStatusUpdatedEvent
{
    public Guid RequestId { get; init; }
    public int Status { get; init; }                  // 1=Running, 2=Success, 3=Failed
    public int? ResultType { get; init; }             // APENAS para OO: 0=RESOLVED, 1=DIAGNOSED, 2=NO_ACTION_TAKEN
    public string? AwxOoExecutionStatus { get; init; }// Status original (successful, COMPLETED, etc)
    public string? ExecutionId { get; init; }         // AwxOoJobId
    public string? ErrorMessage { get; init; }        // Se falhou
    public DateTime UpdatedAtUtc { get; init; }
}
```

## 🌐 Integração com Sistemas Externos

### AWX (Ansible Automation Platform)

**Disparar execução:**
```http
POST https://awx.example.com/api/v2/job_templates/{id}/launch/
Authorization: Basic {base64(username:password)}
Content-Type: application/json

{
  "extra_vars": {
    "email": "user@example.com",
    "department": "ti"
  }
}
```

**Response:**
```json
{
  "id": 98765,
  "status": "pending"
}
```

**Consultar status:**
```http
GET https://awx.example.com/api/v2/jobs/{id}/
Authorization: Basic {base64(username:password)}
```

**Response:**
```json
{
  "id": 98765,
  "status": "successful",
  "started": "2026-01-27T19:14:00Z",
  "finished": "2026-01-27T19:15:35Z"
}
```

**Statuses:** new, pending, waiting, running, successful, failed, error, canceled

---

### OO (Operations Orchestration)

**Disparar execução:**
```http
POST https://oo.example.com/executions
Authorization: Basic {base64(username:password)}
Content-Type: application/json

{
  "flowUuid": "c1234567-89ab-cdef-0123-456789abcdef",
  "inputs": {
    "email": "user@example.com",
    "department": "ti"
  }
}
```

**Response:**
```
12345678901
```
(Retorna apenas um string numérico - o executionId)

**Consultar status:**
```http
GET https://oo.example.com/executions/{id}/execution-log
Authorization: Basic {base64(username:password)}
```

**Response:**
```json
{
  "executionId": "12345678901",
  "status": "COMPLETED",
  "resultStatusType": "RESOLVED"
}
```

**Statuses:** RUNNING, COMPLETED, SYSTEM_FAILURE, PAUSED, PENDING_PAUSE, CANCELED, PENDING_CANCEL

**ResultStatusTypes:** RESOLVED, DIAGNOSED, NO_ACTION_TAKEN, ERROR

---

## 🗄️ Banco de Dados

**Database:** `orca_orchestrator` (PostgreSQL)

**Table Schema:**
```sql
CREATE TABLE "JobExecutions" (
    "Id" uuid PRIMARY KEY,
    "RequestId" uuid NOT NULL,
    "ExecutionTargetType" integer NOT NULL,          -- 0=AWX, 1=OO
    "ExecutionResourceType" integer,
    "ExecutionResourceId" text NOT NULL,
    "ExecutionStatus" text NOT NULL DEFAULT 'pending',
    "AwxOoJobId" text,
    "AwxOoExecutionStatus" text,
    "PollingAttempts" integer NOT NULL DEFAULT 0,
    "LastPolledAtUtc" timestamp with time zone,
    "CompletedAtUtc" timestamp with time zone,
    "ErrorMessage" text,
    "ExecutionPayload" jsonb,
    "ExecutionResponse" jsonb,
    "CreatedAtUtc" timestamp with time zone NOT NULL,
    "UpdatedAtUtc" timestamp with time zone NOT NULL
);

CREATE INDEX "IX_JobExecutions_RequestId" ON "JobExecutions" ("RequestId");
CREATE INDEX "IX_JobExecutions_ExecutionStatus" ON "JobExecutions" ("ExecutionStatus");
CREATE INDEX "IX_JobExecutions_AwxOoJobId" ON "JobExecutions" ("AwxOoJobId");
```

## 🚀 Como Executar

### Via Compose
```bash
cd /home/danielbachiega/Documentos/ORCA

# Build
podman-compose build --no-cache orchestrator-api

# Subir
podman-compose up -d orchestrator-api

# Logs
podman logs -f orca-orchestrator-api
```

### Localmente
```bash
cd services/Orca.Orchestrator/Orca.Orchestrator.Api

# Criar migration se necessário
dotnet ef migrations add InitialCreate \
  --project ../Orca.Orchestrator.Infrastructure \
  --startup-project .

# Rodar
dotnet run
```

**Swagger:** http://localhost:5005/swagger
**RabbitMQ Management:** http://localhost:15672 (guest/guest)

## 📦 Dependências

- .NET 8
- Entity Framework Core 8
- **MassTransit 8.1.0** (message bus)
- **MassTransit.RabbitMQ 8.1.0** (RabbitMQ transport)
- **Polly 8.2.0** (retry policies com exponential backoff)
- HttpClientFactory (built-in)
- PostgreSQL 16 (com JSONB)
- RabbitMQ 3 Management

## 🔌 Configuração Necessária

### appsettings.json (referência)
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=postgres;Port=5432;Database=orca_orchestrator;Username=orca;Password=orca123"
  },
  "RabbitMQ": {
    "Host": "rabbitmq",
    "Username": "guest",
    "Password": "guest"
  },
  "ExternalServices": {
    "AwxBaseUrl": "https://awx.example.com",
    "AwxUsername": "admin",
    "AwxPassword": "password",
    "OoBaseUrl": "https://oo.example.com",
    "OoUsername": "admin",
    "OoPassword": "password",
    "AllowInvalidSsl": false
  },
  "Orchestrator": {
    "LaunchRetry": {
      "MaxAttempts": 5,
      "BaseDelaySeconds": 5,
      "MaxDelaySeconds": 120
    }
  }
}
```

### Variáveis de ambiente (compose)
```bash
# Endpoints e credenciais AWX/OO
AWX_HOST=https://awx.example.com
AWX_USERNAME=admin
AWX_PASSWORD=password
OO_HOST=https://oo.example.com
OO_USERNAME=admin
OO_PASSWORD=password

# SSL inválido (somente dev/test)
ExternalServices__AllowInvalidSsl=true

# Retry (opcional)
Orchestrator__LaunchRetry__MaxAttempts=5
Orchestrator__LaunchRetry__BaseDelaySeconds=5
Orchestrator__LaunchRetry__MaxDelaySeconds=120
```

Exemplo:
```bash
AWX_HOST=https://awx-real.com \
AWX_USERNAME=svc_awx \
AWX_PASSWORD=secret \
OO_HOST=https://oo-real.com \
OO_USERNAME=svc_oo \
OO_PASSWORD=secret \
ExternalServices__AllowInvalidSsl=true \
podman-compose up -d
```

## 🧪 Testando Integração

### Ver eventos no RabbitMQ
```bash
curl -s -u guest:guest http://localhost:15672/api/queues | \
  jq '.[] | select(.name | contains("orchestrator")) | {name, messages}'
```

### Verificar JobExecutions no banco
```bash
podman exec orca-postgres psql -U orca -d orca_orchestrator -c \
  "SELECT id, request_id, execution_status, polling_attempts, created_at_utc FROM \"JobExecutions\" ORDER BY created_at_utc DESC LIMIT 5;"
```

### Simular RequestCreatedEvent (manual)
```bash
# Publicar manualmente no RabbitMQ (para teste)
curl -X POST http://localhost:15672/api/exchanges/%2F/RequestCreated/publish \
  -u guest:guest \
  -H "Content-Type: application/json" \
  -d '{
    "routing_key": "test",
    SSL Certificate Validation Error
**Sintoma:** `Handshake failure` ou `unable to verify the first certificate`

**Solução:** Ativar `AllowInvalidSsl=true` em appsettings ou variável de ambiente:
```bash
ExternalServices__AllowInvalidSsl=true podman-compose up -d
```

**⚠️ Atenção:** Use apenas em desenvolvimento/teste com certificados auto-assinados. Em produção, resolva o certificado.

---

### Launch falha mas não relança
**Sintoma:** JobExecution fica com `ExecutionStatus=failed` imediatamente após erro

**Verificar:**
- Logs do consumer: `podman logs orca-orchestrator-api | grep "SendToAwxOoAsync"`
- Verificar `LaunchAttempts` no banco: `SELECT "Id", "LaunchAttempts", "ExecutionStatus" FROM "JobExecutions" ORDER BY "CreatedAtUtc" DESC LIMIT 5;`
- Se `LaunchAttempts > 0` e status é `retry_pending`, o retry está funcionando

---

### Retry não acontece
**Sintoma:** Status permanece `retry_pending` indefinidamente

**Verificar:**
- PollingWorker está rodando: `podman logs orca-orchestrator-api | grep "PollingWorker"`
- `NextLaunchAttemptAtUtc` está no passado: `SELECT "NextLaunchAttemptAtUtc" FROM "JobExecutions" WHERE "ExecutionStatus"='retry_pending';`
- `LaunchAttempts < MaxAttempts` (default 5): verifique configuração em appsettings

---

### PollingWorker não está rodando
- Verificar logs: `podman logs orca-orchestrator-api | grep "PollingWorker"`
- Confirmar que não há erro de DI no Program.cs
- Verificar se está em debug mode

### Polling não atualiza status
- Verificar AWX/OO está acessível: `curl https://awx.example.com/api/v2/`
- Verificar credenciais em appsettings.json
- Verificar que AwxOoJobId foi salvo no banco (execuções com `ExecutionStatus=running`)
- Verificar logs: `podman logs orca-orchestrator-api | grep "PollingWorker"`
- Confirmar que não há erro de DI no Program.cs
- Verificar se está em debug mode

### Polling não atualiza status
- Verificar AWX/OO está acessível: `curl https://awx.example.com/api/v2/`
- Verificar credenciais em appsettings.json
- Verificar que AwxOoJobId foi salvo no banco

### Consumer não processa RequestCreatedEvent
- Verificar queue foi criada: http://localhost:15672/#/queues
- Logs do consumer: `podman logs orca-orchestrator-api | grep "RequestCreatedEvent"`
- Confirmar que Requests publicou o evento

## 🔗 Integração com Outros Serviços

- **Requests Service:** Consome RequestCreatedEvent, publica RequestStatusUpdatedEvent
- **SharedContracts:** Define message contracts compartilhados
- **AWX/OO:** Sistemas externos que executam workflows
- **RabbitMQ:** Message broker para comunicação assíncrona

## 📚 Referências

- [MassTransit Documentation](https://masstransit-project.com/)
- [Polly Resilience Policies](https://github.com/App-vNext/Polly)
- [AWX API Documentation](https://docs.ansible.com/ansible-tower/latest/html/towerapi/)
- [Operations Orchestration REST API](https://docs.microfocus.com/itom/Operations_Orchestration/21.02.00)
- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)
- [Background Services in .NET](https://learn.microsoft.com/en-us/dotnet/core/extensions/hosted-services)
