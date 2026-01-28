# 🎫 Orca Requests Service

Microserviço responsável pela **gestão de solicitações de execução** de ofertas na plataforma ORCA. Gerencia o ciclo de vida completo de requisições, desde criação até conclusão, com integração assíncrona via RabbitMQ.

## 🎯 Responsabilidades

### Request Management
- **Criar requisições** vinculadas a ofertas e formulários
- **Rastrear status** da execução (Pending → Running → Success/Failed)
- **Armazenar dados do formulário** em formato JSONB
- **Publicar eventos** para notificar Orchestrator de novas requisições
- **Consumir eventos** de atualização de status do Orchestrator
- **Consultar histórico** de execuções por usuário, oferta ou combinação

### Event-Driven Integration
- **Publica:** `RequestCreatedEvent` quando usuário cria requisição
- **Consome:** `RequestStatusUpdatedEvent` quando Orchestrator atualiza execução
- **Retry automático** com MassTransit em caso de falha
- **Logging** completo para debug e auditoria

## 📊 Modelo de Dados

### Entidade: Request

```csharp
public class Request
{
    public Guid Id { get; set; }
    public Guid OfferId { get; set; }                    // FK para Offer
    public Guid FormDefinitionId { get; set; }           // FK para FormDefinition
    public int ExecutionTargetType { get; set; }         // 0=AWX, 1=OO (capturado do ExecutionTemplate)
    public int? ExecutionResourceType { get; set; }      // 0=JobTemplate, 1=Workflow (null para OO)
    public string ExecutionResourceId { get; set; }      // ID do job/workflow/flow (imutável)
    public string UserId { get; set; }                   // ID do usuário solicitante
    public string FormData { get; set; }                 // JSONB com respostas
    public RequestStatus Status { get; set; }            // Pending/Running/Success/Failed
    public ExecutionResultType? ResultType { get; set; } // Success/Diagnosed/NoActionTaken
    public string? AwxOoExecutionStatus { get; set; }    // Status original AWX/OO
    public string? ExecutionId { get; set; }             // ID da execução AWX/OO
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? StartedAtUtc { get; set; }
    public DateTime? CompletedAtUtc { get; set; }
    public string? ErrorMessage { get; set; }

    // Métodos de domínio
    public void MarkAsRunning(string executionId) { ... }
    public void MarkAsSuccess(ExecutionResultType resultType, string? awxStatus) { ... }
    public void MarkAsFailed(string errorMessage, string? awxStatus) { ... }
}
```

### Enums

```csharp
public enum RequestStatus
{
    Pending = 0,   // Aguardando processamento
    Running = 1,   // Em execução no AWX/OO
    Success = 2,   // Concluído com sucesso
    Failed = 3     // Falhou
}

public enum ExecutionResultType
{
    Success = 0,         // Execução bem-sucedida
    Diagnosed = 1,       // Diagnosticado (verificação)
    NoActionTaken = 2    // Nenhuma ação necessária
}
```

## 🏗️ Arquitetura (Clean Architecture)

```
Orca.Requests/
├── Orca.Requests.Api/
│   ├── Controllers/
│   │   └── RequestsController.cs           # Endpoints REST
│   ├── Middleware/
│   │   └── GlobalExceptionHandler.cs       # RFC 7807
│   ├── Dockerfile
│   └── Program.cs                           # DI + MassTransit
│
├── Orca.Requests.Application/
│   ├── Requests/
│   │   ├── Dtos.cs                         # Create/Update/Summary/Details
│   │   ├── RequestDtoValidators.cs         # FluentValidation + JSON
│   │   ├── RequestMappings.cs              # Entity ↔ DTO
│   │   ├── IRequestService.cs              # Contrato
│   │   └── RequestService.cs               # Lógica + publica eventos
│   ├── Consumers/
│   │   └── RequestStatusUpdatedConsumer.cs # MassTransit consumer
│
├── Orca.Requests.Domain/
│   ├── Entities/
│   │   └── Request.cs                      # Entidade rica (métodos)
│   └── Repositories/
│       └── IRequestRepository.cs            # Contrato
│
└── Orca.Requests.Infrastructure/
    ├── RequestsContext.cs                  # DbContext (JSONB)
    ├── Repositories/
    │   └── RequestRepository.cs             # Implementação
    ├── Migrations/
    │   └── 20260125023953_InitialCreate.cs
    └── Data/
```

## 🔌 Endpoints

### GET /api/requests
Listar todas as requisições.

**Response (200 OK):**
```json
[
  {
    "id": "a62af38d-ab5e-44a3-a568-584ffc46dd28",
    "offerId": "550e8400-e29b-41d4-a716-446655440000",
    "formDefinitionId": "660e8400-e29b-41d4-a716-446655440001",
    "userId": "user123",
    "status": 2,
    "createdAtUtc": "2026-01-27T19:13:47.283Z",
    "completedAtUtc": "2026-01-27T19:15:30.120Z"
  }
]
```

### GET /api/requests/{id}
Obter requisição específica com detalhes completos.

**Response (200 OK):**
```json
{
  "id": "a62af38d-ab5e-44a3-a568-584ffc46dd28",
  "offerId": "550e8400-e29b-41d4-a716-446655440000",
  "formDefinitionId": "660e8400-e29b-41d4-a716-446655440001",
  "userId": "user123",
  "formData": "{\"email\": \"user@example.com\", \"department\": \"ti\"}",
  "status": 2,
  "resultType": 0,
  "awxOoExecutionStatus": "successful",
  "executionId": "12345",
  "createdAtUtc": "2026-01-27T19:13:47.283Z",
  "startedAtUtc": "2026-01-27T19:14:00.000Z",
  "completedAtUtc": "2026-01-27T19:15:30.120Z",
  "errorMessage": null
}
```

### GET /api/requests/offer/{offerId}
Listar requisições de uma oferta específica.

### GET /api/requests/user/{userId}
Listar requisições de um usuário específico.

### GET /api/requests/user/{userId}/offer/{offerId}
Listar requisições de um usuário para uma oferta específica (filtro combinado).

### POST /api/requests
Criar nova requisição.

**Request Body:**
```json
{
  "offerId": "550e8400-e29b-41d4-a716-446655440000",
  "formDefinitionId": "660e8400-e29b-41d4-a716-446655440001",
  "executionTargetType": 0,
  "executionResourceType": 0,
  "executionResourceId": "12345",
  "userId": "user123",
  "formData": "{\"email\": \"user@example.com\", \"department\": \"ti\"}"
}
```

**Response (201 Created):** Requisição criada + evento `RequestCreatedEvent` publicado no RabbitMQ

**Side Effect:**
```json
// Publicado no RabbitMQ:
{
  "requestId": "a62af38d-ab5e-44a3-a568-584ffc46dd28",
  "offerId": "550e8400-e29b-41d4-a716-446655440000",
  "formDefinitionId": "660e8400-e29b-41d4-a716-446655440001",
  "userId": "user123",
  "formData": "{\"email\": \"user@example.com\"}",
  "createdAtUtc": "2026-01-27T19:13:47.283Z"
}
```

### PUT /api/requests/{id}
Atualizar requisição (uso interno, principalmente).

### DELETE /api/requests/{id}
Deletar requisição.

**Response (204 No Content)**

## 🛡️ Validações

### CreateRequestDto
- **OfferId:** Obrigatório, deve ser GUID válido
- **FormDefinitionId:** Obrigatório, deve ser GUID válido
- **UserId:** Obrigatório, não vazio
- **FormData:** Obrigatório, JSON válido (validado com `JsonDocument.Parse`)

### UpdateRequestDto
- **Id:** Obrigatório
- **Status:** Enum válido (0-3)
- **FormData:** JSON válido

## 🔄 Fluxo Completo (Event-Driven)

```
1. Usuário cria Request via POST /api/requests
   ↓
2. RequestService valida DTO e salva no banco (Status = Pending)
   ↓
3. RequestService publica RequestCreatedEvent no RabbitMQ
   ↓ 
4. Orchestrator consome RequestCreatedEvent
   ↓
5. Orchestrator chama AWX/OO para executar workflow
   ↓
6. Orchestrator publica RequestStatusUpdatedEvent (Running)
   ↓
7. RequestStatusUpdatedConsumer atualiza Request no banco
   ↓ (aguarda conclusão)
8. Orchestrator publica RequestStatusUpdatedEvent (Success/Failed)
   ↓
9. RequestStatusUpdatedConsumer atualiza Request para estado final
```

## 📨 Message Contracts

### RequestCreatedEvent (Publisher)
```csharp
public record RequestCreatedEvent
{
    public Guid RequestId { get; init; }
    public Guid OfferId { get; init; }
    public Guid FormDefinitionId { get; init; }
    public int ExecutionTargetType { get; init; }        // 0=AWX, 1=OO (do ExecutionTemplate)
    public int? ExecutionResourceType { get; init; }     // 0=JobTemplate, 1=Workflow
    public string ExecutionResourceId { get; init; }     // ID imutável do recurso
    public string UserId { get; init; }
    public string FormData { get; init; }
    public DateTime CreatedAtUtc { get; init; }
}
```

### RequestStatusUpdatedEvent (Consumer)
```csharp
public record RequestStatusUpdatedEvent
{
    public Guid RequestId { get; init; }
    public int Status { get; init; }                  // RequestStatus
    public int? ResultType { get; init; }             // ExecutionResultType - APENAS para OO quando COMPLETED, opcional
    public string? AwxOoExecutionStatus { get; init; }
    public string? ExecutionId { get; init; }
    public string? ErrorMessage { get; init; }
    public DateTime? StartedAtUtc { get; init; }
    public DateTime? CompletedAtUtc { get; init; }
}
```

## 🗄️ Banco de Dados

**Database:** `orca_requests` (PostgreSQL)

**Table Schema:**
```sql
CREATE TABLE "Requests" (
    "ExecutionTargetType" integer NOT NULL DEFAULT 0,   -- 0=AWX, 1=OO
    "ExecutionResourceType" integer,                     -- 0=JobTemplate, 1=Workflow (null para OO)
    "ExecutionResourceId" text NOT NULL,                 -- ID do job/workflow/flow
    "UserId" text NOT NULL,
    "FormData" jsonb NOT NULL,       
    "FormDefinitionId" uuid NOT NULL,
    "UserId" text NOT NULL,
    "FormData" jsonb NOT NULL,                    -- JSONB para queries
    "Status" integer NOT NULL DEFAULT 0,
    "ResultType" integer,
    "AwxOoExecutionStatus" text,
    "ExecutionId" text,
    "CreatedAtUtc" timestamp with time zone NOT NULL,
    "StartedAtUtc" timestamp with time zone,
    "CompletedAtUtc" timestamp with time zone,
    "ErrorMessage" text
);

CREATE INDEX "IX_Requests_OfferId" ON "Requests" ("OfferId");
CREATE INDEX "IX_Requests_UserId" ON "Requests" ("UserId");
CREATE INDEX "IX_Requests_Status" ON "Requests" ("Status");
```

## 🚀 Como Executar

### Via Docker Compose
```bash
cd /home/danielbachiega/Documentos/ORCA
podman-compose up -d requests-api
```

### Localmente
```bash
cd services/Orca.Requests/Orca.Requests.Api
dotnet run
```

**Swagger:** http://localhost:5004/swagger
**RabbitMQ Management:** http://localhost:15672 (guest/guest)

## 📦 Dependências

- .NET 8
- Entity Framework Core 8
- **MassTransit 8.1.0** (message bus abstraction)
- **MassTransit.RabbitMQ 8.1.0** (RabbitMQ transport)
- FluentValidation 11.9.0
- PostgreSQL 16 (com suporte JSONB)
- RabbitMQ 3 Management

## 🔗 Integração com Outros Serviços

- **Catalog Service:** Requests referenciam Offers
- **Forms Service:** Requests referenciam FormDefinitions e armazenam FormData
- **Orchestrator Service:** Consome RequestCreatedEvent e publica RequestStatusUpdatedEvent
- **SharedContracts:** Define message contracts compartilhados (RequestCreatedEvent, RequestStatusUpdatedEvent)
- **RabbitMQ:** Message broker para comunicação assíncrona

## 🚨 Tratamento de Erros (RFC 7807)

Todos os erros retornam no formato **ProblemDetails**:

```json
{
  "type": "https://example.com/errors/validation-error",
  "title": "Erro de Validação",
  "status": 400,
  "detail": "FormData deve ser um JSON válido",
  "instance": "POST /api/requests",
  "traceId": "0HN1GDHO4RSQH:00000003"
}
```

### Consumer Error Handling
O `RequestStatusUpdatedConsumer` implementa retry automático via MassTransit:
- **5 tentativas** com backoff exponencial
- **Dead Letter Queue** automática para mensagens com falha permanente
- **Logging** de erros para investigação

## 📝 Exemplos de Uso (cURL)

```bash
# Criar requisição
curl -X POST http://localhost:5004/api/requests \
  -H "Content-Type: application/json" \
  -d '{
    "offerId": "550e8400-e29b-41d4-a716-446655440000",
    "formDefinitionId": "660e8400-e29b-41d4-a716-446655440001",
    "userId": "user123",
    "formData": "{\"email\": \"user@example.com\", \"department\": \"ti\"}"
  }'

# Listar todas
curl http://localhost:5004/api/requests

# Obter por ID
curl http://localhost:5004/api/requests/a62af38d-ab5e-44a3-a568-584ffc46dd28

# Listar por usuário
curl http://localhost:5004/api/requests/user/user123

# Listar por oferta
curl http://localhost:5004/api/requests/offer/550e8400-e29b-41d4-a716-446655440000

# Listar por usuário + oferta (filtro combinado)
curl http://localhost:5004/api/requests/user/user123/offer/550e8400-e29b-41d4-a716-446655440000

# Verificar eventos no RabbitMQ
curl -u guest:guest http://localhost:15672/api/queues

# Ver logs do MassTransit
podman logs --since 30s orca-requests-api | grep MassTransit
```

## 🧪 Testando Integração RabbitMQ

### Ver Exchanges
```bash
curl -s -u guest:guest http://localhost:15672/api/exchanges | \
  jq '.[] | select(.name | contains("RequestCreated"))'
```

### Ver Queues
```bash
curl -s -u guest:guest http://localhost:15672/api/queues | \
  jq '.[] | {name, messages}'
```

### Ver Conexões Ativas
```bash
curl -s -u guest:guest http://localhost:15672/api/connections | \
  jq '.[] | {name, user, channels}'
```

## 🔍 Troubleshooting

### MassTransit não conecta no RabbitMQ
- Verificar se RabbitMQ está rodando: `podman ps | grep rabbitmq`
- Verificar logs de inicialização: `podman logs orca-requests-api | grep MassTransit`
- Confirmar variável de ambiente: `RabbitMq__Host=rabbitmq` (não `RabbitMQ`)

### Eventos não são publicados
- Verificar logs: `podman logs orca-requests-api | grep "Publicando"`
- Ver exchanges no Management UI: http://localhost:15672/#/exchanges
- Confirmar que `IPublishEndpoint` está injetado no RequestService

### Consumer não processa eventos
- Verificar se queue foi criada: http://localhost:15672/#/queues
- Ver logs do consumer: `podman logs orca-requests-api | grep "RequestStatusUpdatedConsumer"`
- Verificar configuração do consumer no Program.cs

## 📚 Referências

- [MassTransit Documentation](https://masstransit-project.com/)
- [RabbitMQ Management Plugin](https://www.rabbitmq.com/management.html)
- [Clean Architecture — Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [RFC 7807 — Problem Details](https://tools.ietf.org/html/rfc7807)
- [PostgreSQL JSONB Type](https://www.postgresql.org/docs/current/datatype-json.html)
- [Event-Driven Architecture](https://martinfowler.com/articles/201701-event-driven.html)
