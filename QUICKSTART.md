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

# Ou via docker-compose diretamente
docker-compose up -d postgres rabbitmq redis

# Verificar status
docker-compose ps
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
docker-compose ps

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

## 🛠️ Tarefas Importantes (TODO)

### 1. Database (EF Core)
- [ ] Criar `DbContext` em cada serviço
- [ ] Configurar `OnModelCreating()` com relacionamentos
- [ ] Gerar migrations: `dotnet ef migrations add Initial`
- [ ] Atualizar DB: `dotnet ef database update`

### 2. Autenticação (Identity Service)
- [ ] Implementar `LdapService` (LdapForNet)
- [ ] Criar endpoint `POST /auth/login`
- [ ] Implementar resolução de roles
- [ ] Criar JWT bearer tokens

### 3. Controllers (cada serviço)
- [ ] Implementar endpoints REST
- [ ] Adicionar validações (FluentValidation)
- [ ] Implementar error handling

### 4. Mensageria (MassTransit)
- [ ] Configurar MassTransit em `Program.cs`
- [ ] Criar consumers para eventos
- [ ] Implementar publicação de eventos

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
docker-compose logs postgres

# Reiniciar
docker-compose restart postgres
```

### Rebuild de containers
```bash
# Parar e remover
docker-compose down

# Reconstruir
docker-compose up --build
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
