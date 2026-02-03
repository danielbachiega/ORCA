# 📦 Orca SharedContracts

Biblioteca compartilhada contendo **message contracts** (event definitions) utilizados pela arquitetura event-driven do ORCA. Centraliza os tipos de eventos para evitar duplicação e manter consistência entre serviços.

## 🎯 Propósito

**Evitar duplicação** de definições de eventos entre múltiplos serviços, garantindo que todos usem exatamente as mesmas estruturas.

### Antes (sem SharedContracts) ❌
```
Orca.Requests.Application/Events/RequestCreatedEvent.cs
Orca.Orchestrator.Application/Events/RequestCreatedEvent.cs  ← DUPLICADO!
```

### Depois (com SharedContracts) ✅
```
Orca.SharedContracts/Events/RequestCreatedEvent.cs
  ↑ Usado por Requests
  ↑ Usado por Orchestrator
```

## 📦 Estrutura

```
Orca.SharedContracts/
├── Events/
│   ├── RequestCreatedEvent.cs          # Publicado por Requests
│   └── RequestStatusUpdatedEvent.cs    # Publicado por Orchestrator
└── Orca.SharedContracts.csproj
```

## 📨 Events Definidos

### RequestCreatedEvent
**Publicador:** Requests Service  
**Consumidor:** Orchestrator Service  
**Quando:** Quando um usuário cria uma nova requisição

```csharp
public record RequestCreatedEvent
{
    public Guid RequestId { get; init; }
    public Guid OfferId { get; init; }
    public Guid FormDefinitionId { get; init; }
    public int ExecutionTargetType { get; init; }        // 0=AWX, 1=OO
    public int? ExecutionResourceType { get; init; }     // 0=JobTemplate, 1=Workflow
    public string ExecutionResourceId { get; init; }     // ID do recurso
    public string UserId { get; init; }
    public string FormData { get; init; }                // JSON com respostas
    public DateTime CreatedAtUtc { get; init; }
}
```

---

### RequestStatusUpdatedEvent
**Publicador:** Orchestrator Service  
**Consumidor:** Requests Service  
**Quando:** Status de execução muda (Running/Success/Failed)

```csharp
public record RequestStatusUpdatedEvent
{
    public Guid RequestId { get; init; }
    public int Status { get; init; }                  // RequestStatus enum (1/2/3)
    public int? ResultType { get; init; }             // ExecutionResultType (0/1/2) - APENAS para OO
    public string? AwxOoExecutionStatus { get; init; }// Status original do sistema
    public string? ExecutionId { get; init; }         // ID da execução remota
    public string? ErrorMessage { get; init; }        // Se falhou, por quê?
    public DateTime UpdatedAtUtc { get; init; }
}
```

## 🔌 Como Usar

### 1. Adicionar Referência ao Projeto

```bash
cd services/[ServiceName]/[ServiceName].Application

dotnet add reference ../../Orca.SharedContracts/Orca.SharedContracts.csproj
```

### 2. Importar Event no Código

```csharp
using Orca.SharedContracts.Events;

// Publicar
await publishEndpoint.Publish(new RequestCreatedEvent
{
    RequestId = request.Id,
    OfferId = request.OfferId,
    // ...
});

// Consumir
public class RequestCreatedEventConsumer : IConsumer<RequestCreatedEvent>
{
    public async Task Consume(ConsumeContext<RequestCreatedEvent> context)
    {
        var @event = context.Message;
        // processar...
    }
}
```

## 🏗️ Serviços que Usam SharedContracts

| Serviço | Referência | Usa Events |
|---------|-----------|-----------|
| **Requests** | ✅ Orca.Requests.Application → SharedContracts | Publica: RequestCreatedEvent<br/>Consome: RequestStatusUpdatedEvent |
| **Orchestrator** | ✅ Orca.Orchestrator.Application → SharedContracts | Consome: RequestCreatedEvent<br/>Publica: RequestStatusUpdatedEvent |

## 🚀 Como Adicionar Novo Event

Se você precisa criar um novo tipo de evento compartilhado:

### 1. Criar arquivo em `Events/`

```csharp
// Events/MeuNovoEvent.cs
namespace Orca.SharedContracts.Events;

public record MeuNovoEvent
{
    public Guid Id { get; init; }
    public string Descricao { get; init; }
    public DateTime OcorridoAtUtc { get; init; }
}
```

### 2. Adicionar referência nos serviços que usarão

```bash
dotnet add reference ../../Orca.SharedContracts/Orca.SharedContracts.csproj
```

### 3. Usar no código

```csharp
using Orca.SharedContracts.Events;

await publishEndpoint.Publish(new MeuNovoEvent { ... });
```

## 📦 Dependências

SharedContracts **não tem dependências externas** - apenas tipos CLR padrão:
- `System.Collections.Generic`
- `System`

Isso torna leve e evita conflitos de versão.

## 🔄 MassTransit Configuration

MassTransit **NÃO cria queues automaticamente** a partir de SharedContracts. Você precisa configurar no `Program.cs` de cada serviço:

```csharp
builder.Services.AddMassTransit(x =>
{
    // Registrar Consumer
    x.AddConsumer<RequestCreatedEventConsumer>();
    
    x.UsingRabbitMq((context, cfg) =>
    {
        // ... configuração do host
        
        // Configurar Endpoint da fila
        cfg.ReceiveEndpoint("meu-queue", e =>
        {
            e.ConfigureConsumer<RequestCreatedEventConsumer>(context);
        });
    });
});
```

**Importante:** Cada consumer define sua própria fila. SharedContracts apenas define os tipos.

## 🛡️ Versionamento de Events

Ao modificar um event em SharedContracts:

1. **Adicionar campos opcionais** (com `?`) é seguro - compatível com versões antigas
2. **Remover campos** quebra consumidores antigos - evitar
3. **Renomear eventos** quebra tudo - usar `[MessageUrn]` do MassTransit para compatibilidade

### Exemplo: Adicionar campo com backward compatibility

```csharp
public record RequestCreatedEvent
{
    // ... campos existentes
    
    // Novo campo - optional para não quebrar versões antigas
    public string? NovosCampo { get; init; }  // ← Safe
}
```

## 📚 Referências

- [MassTransit Events Documentation](https://masstransit-project.com/documentation/concepts/events)
- [Event Versioning Strategies](https://github.com/MassTransit/MassTransit/wiki/Advanced-Configuration#message-versioning)
- [Clean Architecture Message Contracts](https://herbertograca.com/2017/09/14/event-driven-architecture/)

## 🔗 Relação com Outros Serviços

- **Requests Service:** Publica `RequestCreatedEvent` que está definida aqui
- **Orchestrator Service:** Consome `RequestCreatedEvent` e publica `RequestStatusUpdatedEvent` que está definida aqui
- **Future Services:** Podem adicionar novos eventos conforme necessário

## 📝 Exemplo Completo: Adicionando Novo Event

Cenário: Você quer notificar quando uma execução foi retentada (retry).

### 1. Adicionar Event em SharedContracts
```csharp
// Events/ExecutionRetriedEvent.cs
namespace Orca.SharedContracts.Events;

public record ExecutionRetriedEvent
{
    public Guid JobExecutionId { get; init; }
    public Guid RequestId { get; init; }
    public int AttemptNumber { get; init; }
    public string Reason { get; init; }
    public DateTime RetriedAtUtc { get; init; }
}
```

### 2. Publicar no Orchestrator
```csharp
// JobExecutionService.cs
await _publishEndpoint.Publish(new ExecutionRetriedEvent
{
    JobExecutionId = execution.Id,
    RequestId = execution.RequestId,
    AttemptNumber = execution.PollingAttempts,
    Reason = $"AWX retornou status pendente",
    RetriedAtUtc = DateTime.UtcNow
});
```

### 3. Consumir em outro serviço (ex: Notificações)
```csharp
// NotificationService.Application/Consumers/ExecutionRetriedConsumer.cs
public class ExecutionRetriedConsumer : IConsumer<ExecutionRetriedEvent>
{
    public async Task Consume(ConsumeContext<ExecutionRetriedEvent> context)
    {
        var @event = context.Message;
        await _notificationService.EnviarAlerta(
            $"Execução {event.JobExecutionId} foi retentada. Tentativa {event.AttemptNumber}."
        );
    }
}
```

---

**SharedContracts é o "contrato social" entre seus microserviços!** 🤝
