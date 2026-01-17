# 🐳 ORCA — Orchestrator Catalog Application

## Estrutura de Microserviços

A arquitetura foi reorganizada em microserviços completamente independentes, cada um com sua própria solução (.sln) e estrutura clean architecture.

### 📁 Estrutura de Diretórios

```
ORCA/
├── Orca.sln                          # Solução raiz (referencia todos os serviços)
├── docker-compose.yml                # Orquestração de containers
├── README.md                         # Este arquivo
│
├── services/
│   ├── Orca.Catalog/
│   │   ├── Orca.Catalog.sln
│   │   ├── Orca.Catalog.Api/
│   │   ├── Orca.Catalog.Application/
│   │   ├── Orca.Catalog.Domain/
│   │   └── Orca.Catalog.Infrastructure/
│   │
│   ├── Orca.Identity/
│   │   ├── Orca.Identity.sln
│   │   ├── Orca.Identity.Api/
│   │   ├── Orca.Identity.Application/
│   │   ├── Orca.Identity.Domain/
│   │   └── Orca.Identity.Infrastructure/
│   │
│   ├── Orca.Forms/
│   │   ├── Orca.Forms.sln
│   │   ├── Orca.Forms.Api/
│   │   ├── Orca.Forms.Application/
│   │   ├── Orca.Forms.Domain/
│   │   └── Orca.Forms.Infrastructure/
│   │
│   ├── Orca.Requests/
│   │   ├── Orca.Requests.sln
│   │   ├── Orca.Requests.Api/
│   │   ├── Orca.Requests.Application/
│   │   ├── Orca.Requests.Domain/
│   │   └── Orca.Requests.Infrastructure/
│   │
│   └── Orca.Orchestrator/
│       ├── Orca.Orchestrator.sln
│       ├── Orca.Orchestrator.Api/
│       ├── Orca.Orchestrator.Application/
│       ├── Orca.Orchestrator.Domain/
│       └── Orca.Orchestrator.Infrastructure/
│
├── shared/
│   └── Orca.Shared/
│       ├── Orca.Shared.sln
│       ├── Orca.Shared.Domain/        # Entidades base compartilhadas
│       ├── Orca.Shared.Events/        # Eventos de domínio (MassTransit)
│       └── Orca.Shared.Contracts/     # DTOs e contratos de API
│
└── frontend/                          # (A ser criado)
    └── orca-app/                      # Next.js
```

## 🚀 Serviços

### 1. **Orca.Catalog** (porta 5001)
- **Responsabilidade**: Gerenciar catálogo de ofertas
- **Endpoints**: 
  - `GET /api/offers` — Listar ofertas
  - `GET /api/offers/{id}` — Detalhes da oferta
  - `POST /api/admin/offers` — Criar oferta
  - `PUT /api/admin/offers/{id}` — Atualizar oferta

### 2. **Orca.Identity** (porta 5002)
- **Responsabilidade**: Autenticação LDAP e resolução de roles
- **Endpoints**:
  - `POST /api/auth/login` — Login com LDAP
  - `GET /api/users/{samAccount}/roles` — Resolver roles do usuário
  - `POST /api/admin/roles` — Criar role
  - `POST /api/admin/roles/{id}/ad-groups` — Vincular grupos AD

### 3. **Orca.Forms** (porta 5003)
- **Responsabilidade**: Gerenciar definições de formulários
- **Endpoints**:
  - `GET /api/forms/{offerId}` — Obter schema do formulário
  - `POST /api/forms` — Criar formulário
  - `PUT /api/forms/{id}` — Atualizar formulário

### 4. **Orca.Requests** (porta 5004)
- **Responsabilidade**: Gerenciar requisições de ofertas
- **Endpoints**:
  - `POST /api/requests` — Criar requisição
  - `GET /api/requests` — Listar requisições do usuário
  - `GET /api/requests/{id}` — Detalhes da requisição
  - `PATCH /api/requests/{id}/status` — Atualizar status

### 5. **Orca.Orchestrator** (porta 5005)
- **Responsabilidade**: Orquestração com AWX/OpenStack
- **Endpoints**:
  - `POST /api/executions` — Executar template no AWX
  - `GET /api/executions/{id}` — Status da execução

## 🔧 Infraestrutura

### Serviços de Suporte (docker-compose)
- **PostgreSQL 16** (porta 5432): Bancos de dados
- **RabbitMQ 3** (porta 5672): Mensageria
- **Redis 7** (porta 6379): Cache

### Configuração de Ambiente

Criar `.env` na raiz com:
```bash
# LDAP Configuration
LDAP_HOST=ldap.example.com
LDAP_PORT=389
LDAP_BASE_DN=dc=example,dc=com
LDAP_BIND_USER=cn=admin,dc=example,dc=com
LDAP_BIND_PASSWORD=password

# AWX Configuration
AWX_HOST=https://awx.example.com
AWX_TOKEN=your_token

# Database
DB_PASSWORD=orca123

# Redis
REDIS_PASSWORD=
```

## 📦 Dependências Compartilhadas (Orca.Shared)

### Orca.Shared.Domain
```csharp
public abstract class BaseEntity
{
    public Guid Id { get; set; } = Guid.NewGuid();
    public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    public DateTime? UpdatedAtUtc { get; set; }
}
```

### Orca.Shared.Events
Eventos para mensageria com MassTransit:
- `OfferCreatedEvent`
- `OfferPublishedEvent`
- `RequestCreatedEvent`
- `RequestApprovedEvent`
- `RequestExecutedEvent`

### Orca.Shared.Contracts
DTOs e contratos de API:
- `CreateOfferRequest`
- `UpdateOfferRequest`
- `CreateRequestRequest`
- `UserIdentityDto`

## 🐳 Como Rodar

### Desenvolvimento Local (com containers)
```bash
# Subir toda a infraestrutura
docker-compose up -d

# Verificar status
docker-compose ps

# Logs
docker-compose logs -f [service-name]
```

### Desenvolvimento (Visual Studio / VS Code)
```bash
# Abrir solução raiz
code Orca.sln

# Ou abrir solução específica
code services/Orca.Catalog/Orca.Catalog.sln

# Restaurar dependências
dotnet restore

# Build
dotnet build

# Run específico
cd services/Orca.Catalog/Orca.Catalog.Api
dotnet run
```

## 🔄 Fluxo de Comunicação

```
User
  ↓
┌─────────────────────────────┐
│   Identity Service (LDAP)   │  ← Autentica e resolve roles
└──────────────┬──────────────┘
               ↓
┌─────────────────────────────┐
│   API Gateway (Future)      │  ← YARP (quando implementado)
└──────────────┬──────────────┘
               ↓
         ┌─────┴─────┬───────────┬────────────┐
         ↓           ↓           ↓            ↓
    ┌────────┐ ┌────────┐ ┌────────┐ ┌────────────┐
    │Catalog │ │ Forms  │ │Request │ │Orchestrator│
    └───┬────┘ └───┬────┘ └───┬────┘ └────┬───────┘
        ↓           ↓           ↓           ↓
     ┌────────────────────────────────────────┐
     │         RabbitMQ (Mensageria)          │
     └────────────────────────────────────────┘
        ↓
     ┌────────────────────────────────────────┐
     │   PostgreSQL (Dados) + Redis (Cache)   │
     └────────────────────────────────────────┘
```

## 📋 Próximos Passos

- [ ] Implementar DbContext (EF Core) em cada serviço
- [ ] Adicionar LDAP Service (Identity)
- [ ] Configurar MassTransit em cada serviço
- [ ] Criar Controllers REST
- [ ] Implementar autenticação JWT
- [ ] Criar API Gateway (YARP)
- [ ] Frontend (Next.js)
- [ ] Testes automatizados
- [ ] CI/CD (GitHub Actions)

## 🏗️ Clean Architecture (cada serviço)

```
Orca.X.Api/              # Controllers, Program.cs
Orca.X.Application/      # Use Cases, Mappers, DTOs
Orca.X.Domain/           # Entidades, Interfaces
Orca.X.Infrastructure/   # EF Core, Repos, Services Externos
```

## 📖 Referências

- [ASP.NET Core Minimal APIs](https://docs.microsoft.com/en-us/aspnet/core/fundamentals/minimal-apis)
- [MassTransit Docs](https://masstransit.io/)
- [EF Core](https://docs.microsoft.com/en-us/ef/core/)
- [LdapForNet](https://github.com/flamencist/LdapForNet)

---

**Autor**: ORCA Team  
**Data**: 17 de janeiro de 2026  
**Status**: Estrutura base criada ✅
