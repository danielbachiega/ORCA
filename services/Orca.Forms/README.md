# 📋 Orca Forms Service

Microserviço responsável pela **gestão de formulários dinâmicos (JSON Schema)** e **configuração de execução (ExecutionTemplates)** da plataforma ORCA. Permite criar, versionar e publicar formulários, além de mapear respostas do formulário para payloads AWX/OO.

## 🎯 Responsabilidades

### FormDefinition
- **Criar formulários** com schemas JSON (campos, validações, layouts)
- **Versionar formulários** (v1, v2, v3...)
- **Publicar versões** para disponibilizar aos usuários
- **Listar por oferta** com histórico completo
- **Obter formulário publicado** de uma oferta

### ExecutionTemplate
- **Configurar** como uma oferta será executada (AWX ou OO)
- **Mapear campos** do formulário para parâmetros do payload
- **Definir valores fixos** que não dependem do formulário
- **1:1 com FormDefinition** (uma oferta tem uma configuração de execução)

## 📊 Modelo de Dados

### Entidade: FormDefinition
- **Id**: UUID identificador único
- **OfferId**: Referência para Offer (FK)
- **Version**: Número da versão (1, 2, 3...)
- **SchemaJson**: JSON Schema JSONB com campos, validações, layout
- **IsPublished**: Booleano (apenas uma versão publicada por oferta)
- **CreatedAtUtc**: Timestamp UTC
- **UpdatedAtUtc**: Timestamp UTC (nullable)

### Entidade: ExecutionTemplate
- **Id**: UUID identificador único
- **FormDefinitionId**: Referência para FormDefinition (FK, UNIQUE 1:1)
- **TargetType**: Enum (0=AWX, 1=OO)
- **ResourceType**: Enum (0=JobTemplate, 1=Workflow) — obrigatório só para AWX
- **ResourceId**: String (ID do template AWX ou flowUuid OO)
- **FieldMappings**: JSONB com array de mapeamentos
- **CreatedAtUtc**: Timestamp UTC
- **UpdatedAtUtc**: Timestamp UTC (nullable)

## 📋 Exemplo de SchemaJson

```json
{
  "title": "User Provisioning",
  "description": "Criar novo usuário no AD",
  "version": 1,
  "fields": [
    {
      "key": "email",
      "label": "Email",
      "type": "text",
      "required": true,
      "validation": {
        "pattern": "^[^@]+@[^@]+\\.[^@]+$",
        "customMessage": "Email inválido"
      },
      "ui": { "placeholder": "user@example.com", "cols": 6 }
    },
    {
      "key": "department",
      "label": "Departamento",
      "type": "select",
      "required": true,
      "options": {
        "values": [
          { "label": "TI", "value": "ti" },
          { "label": "RH", "value": "rh" }
        ]
      },
      "ui": { "cols": 6 }
    }
  ],
  "layout": [["email", "department"]]
}
```

## 🏗️ Arquitetura (Clean Architecture)

```
Orca.Forms/
├── Orca.Forms.Api/
│   ├── Controllers/
│   │   ├── FormDefinitionsController.cs
│   │   └── ExecutionTemplatesController.cs
│   ├── Middleware/
│   │   └── GlobalExceptionHandler.cs (RFC 7807)
│   ├── Dockerfile
│   └── Program.cs (DI)
│
├── Orca.Forms.Application/
│   ├── FormDefinitions/
│   │   ├── Dtos.cs (Create/Update/Summary/Details)
│   │   ├── FormDefinitionDtoValidators.cs (FluentValidation)
│   │   ├── FormDefinitionMappings.cs (Entity ↔ DTO)
│   │   ├── IFormDefinitionService.cs
│   │   └── FormDefinitionService.cs (Lógica de negócio)
│   │
│   └── ExecutionTemplates/
│       ├── Dtos.cs
│       ├── ExecutionTemplateDtoValidators.cs
│       ├── ExecutionTemplateMappings.cs
│       ├── IExecutionTemplateService.cs
│       └── ExecutionTemplateService.cs
│
├── Orca.Forms.Domain/
│   ├── Entities/
│   │   ├── FormDefinition.cs
│   │   └── ExecutionTemplate.cs (com FieldMapping)
│   └── Repositories/
│       ├── IFormDefinitionRepository.cs
│       └── IExecutionTemplateRepository.cs
│
└── Orca.Forms.Infrastructure/
    ├── FormsContext.cs (DbContext)
    ├── Repositories/
    │   ├── FormDefinitionRepository.cs
    │   └── ExecutionTemplateRepository.cs
    ├── Migrations/
    │   ├── 20260124184450_AddFormDefinition.cs
    │   └── 20260124184633_AddExecutionTemplate.cs
    └── Data/
```

## 🔌 Endpoints FormDefinition

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/form-definitions` | Listar todas |
| GET | `/api/form-definitions/{id}` | Obter por ID (com SchemaJson) |
| GET | `/api/form-definitions/offer/{offerId}` | Listar todas de uma oferta |
| GET | `/api/form-definitions/offer/{offerId}/published` | Obter publicada |
| POST | `/api/form-definitions` | Criar nova (Draft) |
| PUT | `/api/form-definitions/{id}` | Atualizar |
| DELETE | `/api/form-definitions/{id}` | Deletar |
| POST | `/api/form-definitions/{id}/publish` | Publicar versão |

### Exemplo POST /api/form-definitions
```json
{
  "offerId": "550e8400-e29b-41d4-a716-446655440000",
  "version": 1,
  "schemaJson": "{\"title\": \"User Provisioning\", \"fields\": [...]}",
  "isPublished": false
}
```

## 🔌 Endpoints ExecutionTemplate

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| GET | `/api/execution-templates` | Listar todas |
| GET | `/api/execution-templates/{id}` | Obter por ID |
| GET | `/api/execution-templates/form-definition/{formDefinitionId}` | Obter configuração do formulário |
| POST | `/api/execution-templates` | Criar nova configuração |
| PUT | `/api/execution-templates/{id}` | Atualizar |
| DELETE | `/api/execution-templates/{id}` | Deletar |

### Exemplo POST /api/execution-templates (AWX)
```json
{
  "formDefinitionId": "550e8400-e29b-41d4-a716-446655440000",
  "targetType": 0,
  "resourceType": 0,
  "resourceId": "12345",
  "fieldMappings": [
    {
      "payloadFieldName": "username",
      "sourceType": 0,
      "sourceValue": "email"
    },
    {
      "payloadFieldName": "manager",
      "sourceType": 1,
      "sourceValue": "IT-Manager"
    }
  ]
}
```

### Exemplo POST /api/execution-templates (OO)
```json
{
  "formDefinitionId": "550e8400-e29b-41d4-a716-446655440000",
  "targetType": 1,
  "resourceType": null,
  "resourceId": "8d52dfc3-1de5-48d4-9c2a-887718de4696",
  "fieldMappings": [
    {
      "payloadFieldName": "input1",
      "sourceType": 0,
      "sourceValue": "email"
    }
  ]
}
```

## 🛡️ Validações

### FormDefinition
- **OfferId**: Obrigatório
- **Version**: > 0
- **SchemaJson**: Obrigatório, JSON válido
- **Regra**: Não pode haver 2 versões publicadas da mesma oferta

### ExecutionTemplate
- **FormDefinitionId**: Obrigatório, deve existir, ÚNICO (1:1)
- **TargetType**: Obrigatório
- **ResourceType**: Obrigatório se TargetType=AWX, Null se OO
- **ResourceId**: Obrigatório, não vazio
- **FieldMappings**: Mínimo 1, cada field com PayloadFieldName e SourceValue

## 🔄 Fluxo Típico

1. **Admin cria FormDefinition v1** com SchemaJson
2. **Admin cria ExecutionTemplate** mapeando campos para AWX/OO
3. **Admin publica FormDefinition** (fica disponível para usuários)
4. **Usuário preenche formulário** (frontend renderiza SchemaJson)
5. **Orchestrator lê ExecutionTemplate** e monta payload
6. **Orchestrator dispara** POST para AWX/OO com dados mapeados

## 🗄️ Banco de Dados

**Database**: `orca_forms` (PostgreSQL)

**Tables**:
- `FormDefinitions` — com índice em OfferId
- `ExecutionTemplates` — com índice único em FormDefinitionId
- `__EFMigrationsHistory` — rastreamento de migrations

## 🚀 Como Executar

### Via Compose
```bash
cd /home/danielbachiega/Documentos/ORCA
podman-compose up -d forms-api
```

### Localmente
```bash
cd services/Orca.Forms/Orca.Forms.Api
dotnet run
```

**Swagger**: http://localhost:5003/swagger

## 📦 Dependências

- .NET 8
- Entity Framework Core 8
- FluentValidation
- PostgreSQL 16
- Swagger/OpenAPI

## 🔗 Integração com Outros Serviços

- **Catalog**: FormDefinitions dependem de Offers
- **Requests**: Usuários criam Requests preenchendo FormDefinitions
- **Orchestrator**: Lê ExecutionTemplate e executa em AWX/OO

## 🚨 Tratamento de Erros (RFC 7807)

Todos os erros retornam em formato **ProblemDetails**:

```json
{
  "type": "https://example.com/errors/validation-error",
  "title": "Erro de Validação",
  "status": 400,
  "detail": "ResourceId é obrigatório; TargetType AWX requer ResourceType",
  "instance": "POST /api/execution-templates",
  "traceId": "0HN1GDHO4RSQH:00000002"
}
```

## 📝 Exemplos de Uso (cURL)

```bash
# Criar FormDefinition
curl -X POST http://localhost:5003/api/form-definitions \
  -H "Content-Type: application/json" \
  -d '{"offerId": "550e8400-e29b-41d4-a716-446655440000", "version": 1, "schemaJson": "{\"title\": \"Form\"}"}'

# Publicar FormDefinition
curl -X POST http://localhost:5003/api/form-definitions/ID/publish

# Criar ExecutionTemplate
curl -X POST http://localhost:5003/api/execution-templates \
  -H "Content-Type: application/json" \
  -d '{"formDefinitionId": "ID", "targetType": 0, "resourceType": 0, "resourceId": "12345", "fieldMappings": [...]}'

# Listar ExecutionTemplates
curl http://localhost:5003/api/execution-templates
```

## 📚 Documentação Técnica

- [JSON Schema](https://json-schema.org/)
- [Clean Architecture](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [RFC 7807 — Problem Details](https://tools.ietf.org/html/rfc7807)
- [EF Core JSONB](https://learn.microsoft.com/en-us/ef/core/modeling/value-conversions)
