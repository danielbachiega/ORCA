# 📦 Orca Catalog Service

Microserviço responsável pela **gestão de ofertas (Offers)** da plataforma ORCA. Implementa operações CRUD de ofertas com validação, auditoria e integração com eventos de domínio.

## 🎯 Responsabilidades

- **Criar ofertas** com informações básicas (Slug, Name, Description, Tags)
- **Gerenciar imagens** para as ofertas (icone por imagem)
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
    public string? ImageAssetId { get; set; }  // Slug da imagem associada
    public DateTime CreatedAtUtc { get; set; }
    public DateTime? UpdatedAtUtc { get; set; }
    public ICollection<OfferRole> VisibleToRoles { get; set; }  // RBAC
}
```

### Entidade: OfferRole (Controle de Acesso)

```csharp
public class OfferRole
{
    public Guid Id { get; set; }
    public Guid OfferId { get; set; }
    public string RoleName { get; set; }  // Ex: "Admin", "Editor", "Consumer"
    public Offer Offer { get; set; }
}
```

### Entidade: ImageAsset

```csharp
public class ImageAsset
{
  public Guid Id { get; set; }
  public string Slug { get; set; }       // Identificador legivel
  public string Name { get; set; }       // Nome exibido
  public string Url { get; set; }        // Caminho relativo (ex: /image-assets/arquivo.png)
  public string ContentType { get; set; }
  public long SizeBytes { get; set; }
  public DateTime CreatedAtUtc { get; set; }
}
```

**Nota:** Ofertas sem roles definidos são visíveis para todos usuários autenticados.

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
    "updatedAtUtc": null,
    "visibleToRoles": ["Admin", "Editor"]
  }
]
```

### GET /api/offers/{id}
Obter oferta específica.

**Response (200 OK):** Objeto individual

**Response (404 Not Found):** Se não existir

### GET /api/offers/by-roles?roles=Admin&roles=Editor
Filtrar ofertas visíveis para determinadas roles.

**Query Params:**
- `roles`: Array de nomes de roles (pode repetir o parâmetro)

**Response (200 OK):** Array de ofertas que o usuário com essas roles pode ver

**Exemplo:**
```bash
curl "http://localhost:5001/api/offers/by-roles?roles=Admin&roles=Editor"
```

### POST /api/offers
Criar nova oferta.

**Request Body:**
```json
{
  "slug": "user-provisioning",
  "name": "User Provisioning",
  "description": "Criar novo usuário no AD",
  "tags": ["ldap", "onboarding"],
  "imageAssetId": "user-provisioning-icon",
  "visibleToRoles": ["Admin", "Editor"]
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
  "updatedAtUtc": null,
  "imageAssetId": "user-provisioning-icon",
  "visibleToRoles": ["Admin", "Editor"]
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
  "active": true,
  "imageAssetId": "user-provisioning-icon"
}
```

**Response (200 OK):** Oferta atualizada

### DELETE /api/offers/{id}
Deletar oferta (soft delete — apenas marca como inativa).

**Response (204 No Content)**

### GET /api/image-assets
Listar imagens disponiveis para associacao na oferta.

**Response (200 OK):**
```json
[
  {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "slug": "user-provisioning-icon",
    "name": "Icone de provisionamento",
    "url": "/image-assets/abc123.png",
    "contentType": "image/png",
    "sizeBytes": 23456,
    "createdAtUtc": "2026-03-07T10:30:00Z"
  }
]
```

### POST /api/image-assets/upload
Upload de uma nova imagem (multipart/form-data).

**Campos:**
- `slug` (string)
- `name` (string)
- `file` (arquivo PNG/JPG ate 1MB)

## 🛡️ Validações

- **Slug:** Obrigatório, único, 3-50 caracteres, apenas lowercase + hífens
- **Name:** Obrigatório, 3-100 caracteres
- **Description:** Opcional, máx 500 caracteres
- **Tags:** Mínimo 1, máximo 5 tags
- **Active:** Default = true
- **VisibleToRoles:** Opcional, array de nomes de roles válidos (ex: "Admin", "Editor", "Consumer")
  - Se vazio ou null: oferta visível para todos usuários autenticados
  - Se preenchido: apenas usuários com roles especificados podem ver
- **ImageAssetId:** Opcional, slug valido (a-z, 0-9, hifen)
- **Upload de imagem:** Somente PNG/JPG, max 1MB

## 🔄 Fluxo Típico

1. **Admin cria oferta** via POST /api/offers
2. **Admin escolhe ou faz upload de icone** via /api/image-assets
3. **Offer fica ativa por padrão** e visível para usuários
4. **Admin pode atualizar** o nome, descrição, tags e icone
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
  "ImageAssetId" text,
    "CreatedAtUtc" timestamp with time zone NOT NULL,
    "UpdatedAtUtc" timestamp with time zone
);
```

```sql
CREATE TABLE "ImageAssets" (
  "Id" uuid NOT NULL PRIMARY KEY,
  "Slug" text NOT NULL UNIQUE,
  "Name" text NOT NULL,
  "Url" text NOT NULL,
  "ContentType" text NOT NULL,
  "SizeBytes" bigint NOT NULL,
  "CreatedAtUtc" timestamp with time zone NOT NULL
);
```

### Migrations Recentes

#### 20260202000000_RenameUpdateAtUtcColumn
**Data:** 02/02/2026  
**Descrição:** Corrigido nome da coluna de `UpdateAtUtc` para `UpdatedAtUtc` para manter consistência com padrão `CreatedAtUtc`.

**Motivo:** O nome anterior tinha typo (faltava o "d"). A correção garante:
- ✅ Consistência de nomenclatura (Created**At**Utc → Updated**At**Utc)
- ✅ Alinhamento com DTOs do frontend (`createdAtUtc`, `updatedAtUtc`)
- ✅ Melhor legibilidade e manutenibilidade

**Impacto:** Breaking change no schema do banco. Requer rebuild dos containers.

**Aplicação:** A migration é aplicada automaticamente ao subir o container via `dbContext.Database.Migrate()` no `Program.cs`.

## 🚀 Como Executar

### Via Compose
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
    "tags": ["ldap", "onboarding"],
    "imageAssetId": "user-provisioning-icon"
  }'

# Listar ofertas
curl http://localhost:5001/api/offers

# Obter oferta
curl http://localhost:5001/api/offers/550e8400-e29b-41d4-a716-446655440000

# Atualizar
curl -X PUT http://localhost:5001/api/offers/550e8400-e29b-41d4-a716-446655440000 \
  -H "Content-Type: application/json" \
  -d '{"name": "User Provisioning v2", "active": true, "tags": ["ldap"], "description": "New desc"}'

# Upload de imagem
curl -X POST http://localhost:5001/api/image-assets/upload \
  -F "slug=user-provisioning-icon" \
  -F "name=Icone de provisionamento" \
  -F "file=@/caminho/icone.png"
```

## 🧪 Testes

Testes unitários e de integração estão em `Orca.Catalog.Application.Tests/`

## 📚 Referências

- [Clean Architecture — Robert C. Martin](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [RFC 7807 — Problem Details for HTTP APIs](https://tools.ietf.org/html/rfc7807)
- [Entity Framework Core — Microsoft Docs](https://docs.microsoft.com/en-us/ef/core/)
