# 📦 Orca Catalog Service

Microserviço responsável pela **gestão de ofertas (Offers)** da plataforma ORCA. Implementa operações CRUD de ofertas com validação, auditoria e integração com eventos de domínio.

## 🎯 Responsabilidades

- **Criar ofertas** com informações básicas (Slug, Name, Description, Tags)
- **Listar ofertas** com filtros e paginação
- **Atualizar ofertas** e seu status (ativo/inativo)
- **Ativar/desativar ofertas** para controlar visibilidade
- **Publicar versões** de ofertas para disponibilizar aos usuários
- **Auditoria completa** (timestamps, rastreamento de mudanças)

## 📊 Modelo de Dados

### Entidade: Offer

```csharp
public class Offer
{
    public Guid Id { get; set; }
    public string Slug { get; set; }           // URL-friendly identifier
    public string Name { get; set; }           // Nome legível
    public string? Description { get; set; }   // Descrição opcional
    public string[] Tags { get; set; }         // Categorização
    public bool Active { get; set; }           // Visibilidade
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
}
```

## 🏗️ Arquitetura (Clean Architecture)

```
Orca.Catalog/
├── Orca.Catalog.Api/
│   ├── Controllers/
│   │   └── OffersController.cs          # Endpoints REST
│   ├── Middleware/
│   │   └── GlobalExceptionHandler.cs    # Tratamento de erros (RFC 7807)
│   ├── Dockerfile
│   └── Program.cs                        # DI e configuração
│
├── Orca.Catalog.Application/
│   └── Offers/
│       ├── Dtos.cs                      # CreateOfferDto, UpdateOfferDto, etc
│       ├── OfferDtoValidators.cs        # FluentValidation
│       ├── OfferMappings.cs             # Entity ↔ DTO
│       ├── IOfferService.cs             # Contrato
│       └── OfferService.cs              # Lógica de negócio
│
├── Orca.Catalog.Domain/
│   ├── Entities/
│   │   └── Offer.cs                     # Entidade
│   └── Repositories/
│       └── IOfferRepository.cs           # Contrato de persistência
│
└── Orca.Catalog.Infrastructure/
    ├── CatalogContext.cs                # DbContext (EF Core)
    ├── Repositories/
    │   └── OfferRepository.cs            # Implementação
    ├── Migrations/
    │   └── [timestamp]_*.cs
    └── Data/
```

## 🔌 Endpoints

### GET /api/offers
Listar todas as ofertas ativas.

**Response (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "slug": "user-provisioning",
    "name": "User Provisioning",
    "description": "Criar novo usuário no AD",
    "tags": ["ldap", "onboarding"],
    "active": true,
    "createdAtUtc": "2026-01-15T10:30:00Z",
    "updatedAtUtc": null
  }
]
```

### GET /api/offers/{id}
Obter oferta específica.

**Response (200 OK):** Objeto individual

**Response (404 Not Found):** Se não existir

### POST /api/offers
Criar nova oferta.

**Request Body:**
```json
{
  "slug": "user-provisioning",
  "name": "User Provisioning",
  "description": "Criar novo usuário no AD",
  "tags": ["ldap", "onboarding"]
}
```

**Response (201 Created):**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "slug": "user-provisioning",
  "name": "User Provisioning",
  "description": "Criar novo usuário no AD",
  "tags": ["ldap", "onboarding"],
  "active": true,
  "createdAtUtc": "2026-01-24T19:30:00Z",
  "updatedAtUtc": null
}
```

### PUT /api/offers/{id}
Atualizar oferta.

**Request Body:**
```json
{
  "name": "User Provisioning v2",
  "description": "Criar novo usuário no AD com suporte a grupos",
  "tags": ["ldap", "onboarding", "groups"],
  "active": true
}
```

**Response (200 OK):** Oferta atualizada

### DELETE /api/offers/{id}
Deletar oferta (soft delete — apenas marca como inativa).

**Response (204 No Content)**

## 🛡️ Validações

- **Slug:** Obrigatório, único, 3-50 caracteres, apenas lowercase + hífens
- **Name:** Obrigatório, 3-100 caracteres
- **Description:** Opcional, máx 500 caracteres
- **Tags:** Mínimo 1, máximo 5 tags
- **Active:** Default = true

## 🔄 Fluxo Típico

1. **Admin cria oferta** via POST /api/offers
2. **Offer fica ativa por padrão** e visível para usuários
3. **Admin pode atualizar** o nome, descrição, tags
4. **Admin pode desativar** a oferta (DELETE)
5. **Usuários veem** apenas ofertas ativas

## 🗄️ Banco de Dados

- **Database:** `orca_catalog` (PostgreSQL)
- **Table:** `Offers`

```sql
CREATE TABLE "Offers" (
    "Id" uuid NOT NULL PRIMARY KEY,
    "Slug" text NOT NULL UNIQUE,
    "Name" text NOT NULL,
    "Description" text,
    "Tags" text[] NOT NULL,
    "Active" boolean NOT NULL DEFAULT true,
    "CreatedAtUtc" timestamp with time zone NOT NULL,
    "UpdatedAtUtc" timestamp with time zone
);
```

## 🚀 Como Executar

### Via Docker Compose
```bash
cd /home/danielbachiega/Documentos/ORCA
podman-compose up -d catalog-api
```

### Localmente
```bash
cd services/Orca.Catalog/Orca.Catalog.Api
dotnet run
```

Acesse Swagger: http://localhost:5001/swagger

## 📦 Dependências

- .NET 8
- Entity Framework Core 8
- FluentValidation
- PostgreSQL
- Swagger/OpenAPI

## 🔗 Integração com Outros Serviços

- **Forms Service:** Ofertas têm FormDefinitions associadas
- **Requests Service:** Usuários criam Requests para ofertas
- **Orchestrator:** Orquestra a execução baseada em ofertas

## 🚨 Tratamento de Erros (RFC 7807)

Todos os erros retornam no formato **ProblemDetails**:

```json
{
  "type": "https://example.com/errors/validation-error",
  "title": "Erro de Validação",
  "status": 400,
  "detail": "Slug já existe; Name não pode estar vazio",
  "instance": "POST /api/offers",
  "traceId": "0HN1GDHO4RSQH:00000001"
}
```

## 📝 Exemplo de Uso (cURL)

```bash
# Criar oferta
curl -X POST http://localhost:5001/api/offers \
  -H "Content-Type: application/json" \
  -d '{
    "slug": "user-provisioning",
    "name": "User Provisioning",
    "description": "Criar novo usuário",
    "tags": ["ldap", "onboarding"]
  }'

# Listar ofertas
curl http://localhost:5001/api/offers

# Obter oferta
curl http://localhost:5001/api/offers/550e8400-e29b-41d4-a716-446655440000

# Atualizar
curl -X PUT http://localhost:5001/api/offers/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{"name": "User Provisioning v2", "active": true, "tags": ["ldap"], "description": "New desc"}'
```

## 🧪 Testes

Testes unitários e de integração estão em `Orca.Catalog.Application.Tests/`

## 📚 Referências

- [Clean Architecture — Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [RFC 7807 — Problem Details for HTTP APIs](https://tools.ietf.org/html/rfc7807)
- [Entity Framework Core — Microsoft Docs](https://docs.microsoft.com/en-us/ef/core/)
