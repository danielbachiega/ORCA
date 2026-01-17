# ✅ Setup Completo - ORCA Microservices

## 📋 Checklist de Criação

### ✅ Estrutura de Serviços

- [x] **Orca.Catalog** (porta 5001)
  - [x] Orca.Catalog.Api
  - [x] Orca.Catalog.Application
  - [x] Orca.Catalog.Domain
  - [x] Orca.Catalog.Infrastructure
  - [x] Orca.Catalog.sln

- [x] **Orca.Identity** (porta 5002)
  - [x] Orca.Identity.Api
  - [x] Orca.Identity.Application
  - [x] Orca.Identity.Domain
  - [x] Orca.Identity.Infrastructure
  - [x] Orca.Identity.sln

- [x] **Orca.Forms** (porta 5003)
  - [x] Orca.Forms.Api
  - [x] Orca.Forms.Application
  - [x] Orca.Forms.Domain
  - [x] Orca.Forms.Infrastructure
  - [x] Orca.Forms.sln

- [x] **Orca.Requests** (porta 5004)
  - [x] Orca.Requests.Api
  - [x] Orca.Requests.Application
  - [x] Orca.Requests.Domain
  - [x] Orca.Requests.Infrastructure
  - [x] Orca.Requests.sln

- [x] **Orca.Orchestrator** (porta 5005)
  - [x] Orca.Orchestrator.Api
  - [x] Orca.Orchestrator.Application
  - [x] Orca.Orchestrator.Domain
  - [x] Orca.Orchestrator.Infrastructure
  - [x] Orca.Orchestrator.sln

### ✅ Projetos Compartilhados

- [x] **Orca.Shared**
  - [x] Orca.Shared.Domain (BaseEntity)
  - [x] Orca.Shared.Events (DomainEvents)
  - [x] Orca.Shared.Contracts (ServiceContracts)
  - [x] Orca.Shared.sln

### ✅ Configuração Raiz

- [x] **Orca.sln** (solução raiz referenciando todos os serviços)
- [x] **docker-compose.yml** (atualizado com todos os serviços)
- [x] **Dockerfiles** para cada API
- [x] **.env.example** (variáveis de ambiente)
- [x] **dev.sh** (script helper)
- [x] **ARCHITECTURE.md** (documentação)
- [x] **QUICKSTART.md** (guia rápido)

---

## 🎯 Próximo Passo: Implementação de Base de Dados

### 1. Adicionar EF Core em cada serviço

Para **Orca.Catalog.Infrastructure** (e repetir para outros):

```bash
cd services/Orca.Catalog/Orca.Catalog.Infrastructure

# Adicionar pacotes NuGet
dotnet add package Microsoft.EntityFrameworkCore.Npgsql --version 8.0.0
dotnet add package Microsoft.EntityFrameworkCore.Design --version 8.0.0
```

### 2. Criar DbContext

Criar arquivo `Data/CatalogContext.cs`:

```csharp
using Microsoft.EntityFrameworkCore;
using Orca.Catalog.Domain.Entities;
using Orca.Catalog.Infrastructure.Data.Configurations;

namespace Orca.Catalog.Infrastructure.Data;

public class CatalogContext : DbContext
{
    public CatalogContext(DbContextOptions<CatalogContext> options) : base(options) { }

    public DbSet<Offer> Offers => Set<Offer>();
    public DbSet<OfferVersion> OfferVersions => Set<OfferVersion>();
    public DbSet<OfferRole> OfferRoles => Set<OfferRole>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        builder.Entity<Offer>()
            .HasKey(o => o.Id);

        builder.Entity<Offer>()
            .HasIndex(o => o.Slug)
            .IsUnique();

        builder.Entity<Offer>()
            .HasMany(o => o.Versions)
            .WithOne(v => v.Offer)
            .HasForeignKey(v => v.OfferId)
            .OnDelete(DeleteBehavior.Cascade);

        builder.Entity<OfferVersion>()
            .HasKey(ov => ov.Id);

        builder.Entity<OfferRole>()
            .HasKey(or => new { or.OfferId, or.RoleName });
    }
}
```

### 3. Registrar em Program.cs

```csharp
// Orca.Catalog.Api/Program.cs
using Orca.Catalog.Infrastructure.Data;

// ...

builder.Services.AddDbContext<CatalogContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));
```

### 4. Criar e aplicar migrations

```bash
cd services/Orca.Catalog/Orca.Catalog.Api

dotnet tool install --global dotnet-ef  # Se não tiver instalado

dotnet ef migrations add Initial --project ../Orca.Catalog.Infrastructure

dotnet ef database update
```

---

## 🚀 Padrão para Implementar Cada Serviço

Seguir este padrão em **cada serviço** para manter consistência:

### 1. **Domain** (Orca.X.Domain)
```
Orca.X.Domain/
├── Entities/
│   └── [YourEntity].cs
├── ValueObjects/
│   └── [YourValueObject].cs
├── Interfaces/
│   └── I[YourRepository].cs
└── Events/
    └── [YourEvent].cs
```

### 2. **Application** (Orca.X.Application)
```
Orca.X.Application/
├── Dtos/
├── Mappers/
├── Services/
└── Handlers/
```

### 3. **Infrastructure** (Orca.X.Infrastructure)
```
Orca.X.Infrastructure/
├── Data/
│   ├── [Service]Context.cs
│   └── Configurations/
├── Repositories/
├── Services/
├── Extensions/
│   └── ServiceCollectionExtensions.cs
└── Migrations/
```

### 4. **Api** (Orca.X.Api)
```
Orca.X.Api/
├── Controllers/
├── Program.cs
├── appsettings.json
└── appsettings.Development.json
```

---

## 📦 Dependências Comuns (adicionar em cada serviço)

```bash
cd services/Orca.X/Orca.X.Infrastructure

# Database
dotnet add package Microsoft.EntityFrameworkCore.Npgsql --version 8.0.0
dotnet add package Microsoft.EntityFrameworkCore.Design --version 8.0.0

# Messaging
dotnet add package MassTransit.RabbitMQ --version 8.1.1

# Logging
dotnet add package Serilog.AspNetCore --version 8.1.0

# Validation
dotnet add package FluentValidation --version 11.9.2
```

---

## 🔍 Verificar Setup

```bash
# Ver estrutura
tree -L 3 services/

# Verificar soluções
ls -la services/*/Orca.*.sln

# Compilar solução raiz
dotnet build Orca.sln

# Restaurar específico
dotnet restore services/Orca.Catalog/Orca.Catalog.sln
```

---

## 🎓 Recursos Úteis

- [Clean Architecture na prática](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [EF Core Relationships](https://docs.microsoft.com/en-us/ef/core/modeling/relationships)
- [MassTransit Getting Started](https://masstransit.io/getting-started)
- [ASP.NET Core Dependency Injection](https://docs.microsoft.com/en-us/dotnet/core/extensions/dependency-injection)

---

**Status**: ✅ Estrutura base pronta para desenvolvimento!

Você pode agora:
1. Implementar DbContext em cada serviço
2. Criar entities do domínio
3. Implementar repositórios
4. Criar controllers REST
5. Adicionar validações

**Próximo checkpoint**: Ter todos os serviços com CRUD básico funcionando ✨
