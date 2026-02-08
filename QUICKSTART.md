# Quick Start - ORCA

## 1️⃣ Primeiro Setup

```bash
# Clonar e entrar no diretório
cd ~/Documentos/ORCA

# Copiar arquivo de configuração
cp .env.example .env

# Restaurar dependências
./dev.sh restore

# Ou manualmente
dotnet restore Orca.sln
```

## 2️⃣ Subir a Infraestrutura

```bash
# Via script helper
./dev.sh infra-up

# Ou via podman-compose diretamente
podman-compose up -d postgres rabbitmq redis

# Verificar status
podman-compose ps
```

## 3️⃣ Desenvolver Localmente

### Opção A: VS Code (recomendado)
```bash
# Abrir solução raiz
code Orca.sln

# Ou solução específica
code services/Orca.Catalog/Orca.Catalog.sln
```

### Opção B: Terminal
```bash
# Build de todos os serviços
./dev.sh build

# Ou específico
cd services/Orca.Catalog/Orca.Catalog.Api
dotnet run
```

## 4️⃣ Rodar com Docker (Completo)

```bash
# Subir tudo (infraestrutura + serviços)
./dev.sh up

# Verificar
podman-compose ps

# Logs de um serviço
./dev.sh logs catalog
./dev.sh logs identity
```

## 🔗 Acessar os Serviços

| Serviço | URL | Descrição |
|---------|-----|----------|
| Catalog | http://localhost:5001 | Gerenciamento de ofertas |
| Identity | http://localhost:5002 | Autenticação LDAP |
| Forms | http://localhost:5003 | Formulários dinâmicos |
| Requests | http://localhost:5004 | Requisições de ofertas |
| Orchestrator | http://localhost:5005 | Execução em AWX |
| RabbitMQ | http://localhost:15672 | Gerenciar filas |

## 📝 Estrutura de Projetos

```
Orca.Catalog/              ← Catálogo de ofertas
  ├── Api/                 ← Controllers REST
  ├── Application/         ← Use cases, DTOs, Mappers
  ├── Domain/              ← Entidades, interfaces
  └── Infrastructure/      ← EF Core, Repositórios

[Similar para Identity, Forms, Requests, Orchestrator]

shared/Orca.Shared/        ← Código compartilhado
  ├── Domain/              ← BaseEntity
  ├── Events/              ← Eventos de domínio
  └── Contracts/           ← DTOs compartilhadas
```

## 🛠️ Checklist Inicial (status atual)

### 1. Database (EF Core)
- [x] `DbContext` por serviço
- [x] `OnModelCreating()` com relacionamentos
- [x] Migrations iniciais
- [x] Atualização de DB automatizada no startup

### 2. Autenticação (Identity Service)
- [x] `LdapService` (mock + AD real)
- [x] Endpoint `POST /auth/login`
- [x] Resolução dinâmica de roles
- [x] JWT de sessão

### 3. Controllers (cada serviço)
- [x] Endpoints REST principais
- [x] Validações (FluentValidation)
- [x] Error handling

### 4. Mensageria (MassTransit)
- [x] Configuração MassTransit
- [x] Consumers para eventos
- [x] Publicação de eventos

### 5. API Gateway (Futuro)
- [ ] Criar projeto YARP
- [ ] Configurar roteamento
- [ ] Adicionar autenticação centralizada

## 🐛 Troubleshooting

### Porta já em uso
```bash
# Ver porta em uso
lsof -i :5001

# Ou matar processo
kill -9 <PID>
```

### PostgreSQL não conecta
```bash
# Verificar se está rodando
podman-compose logs postgres

# Reiniciar
podman-compose restart postgres
```

### Rebuild de containers
```bash
# Parar e remover
podman-compose down

# Reconstruir
podman-compose up --build
```

## 📚 Documentação Adicional

- [ARCHITECTURE.md](./ARCHITECTURE.md) — Visão geral da arquitetura
- [ASP.NET Core](https://docs.microsoft.com/dotnet/core)
- [Entity Framework Core](https://docs.microsoft.com/ef/core)
- [MassTransit](https://masstransit.io/documentation)

---

**Dúvidas?** Verifique os logs:
```bash
./dev.sh logs [service]
```

Happy coding! 🚀
