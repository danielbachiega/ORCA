# Guia de Migrations — Entity Framework Core

Este documento explica como criar e aplicar migrations no projeto ORCA.

## 📋 Estrutura de Migrations

As migrations são armazenadas em cada serviço na pasta:
```
services/[ServiceName]/[ServiceName].Infrastructure/Migrations/
```

Exemplo para Catalog:
```
services/Orca.Catalog/Orca.Catalog.Infrastructure/Migrations/
```

## ✨ Criando uma Nova Migration

### Passo 1: Certifique-se de estar na raiz do repositório
```bash
cd /home/danielbachiega/Documentos/ORCA
```

### Passo 2: Execute o comando de migration
Use o comando abaixo, substituindo `[ServiceName]` e `[MigrationName]`:

```bash
dotnet ef migrations add [MigrationName] \
  --project services/Orca.[ServiceName]/Orca.[ServiceName].Infrastructure \
  --startup-project services/Orca.[ServiceName]/Orca.[ServiceName].Api
```

### Exemplo prático (Catalog):
```bash
dotnet ef migrations add AddFormDefinition \
  --project services/Orca.Catalog/Orca.Catalog.Infrastructure \
  --startup-project services/Orca.Catalog/Orca.Catalog.Api
```

### Por que essas flags?
- `--project`: Aponta para o projeto onde o DbContext está (Infrastructure).
- `--startup-project`: Aponta para o projeto que contém o Program.cs com as configurações de DI.

## 🔄 Aplicando Migrations

### Automática (recomendado para desenvolvimento)
As migrations são aplicadas **automaticamente** ao iniciar a API através do código no `Program.cs`:

```csharp
// Apply migrations
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<CatalogContext>();
    dbContext.Database.Migrate();
}
```

Quando você rodar `podman-compose up -d --build`, as migrations serão aplicadas automaticamente.

### Manual (se necessário)
```bash
dotnet ef database update \
  --project services/Orca.[ServiceName]/Orca.[ServiceName].Infrastructure \
  --startup-project services/Orca.[ServiceName]/Orca.[ServiceName].Api
```

## 📦 Workflow Completo (Desenvolvimento)

1. **Faça alterações no seu DbContext ou Entities**
   - Exemplo: adicione uma nova propriedade a uma entidade

2. **Crie a migration**
   ```bash
   dotnet ef migrations add [DescriptiveNameHere] \
     --project services/Orca.[ServiceName]/Orca.[ServiceName].Infrastructure \
     --startup-project services/Orca.[ServiceName]/Orca.[ServiceName].Api
   ```

3. **Rebuild e suba com Docker**
   ```bash
   podman-compose down
   podman-compose up -d --build
   ```
   A migration será aplicada automaticamente!

4. **Teste seus endpoints**
   Verifique se a alteração foi refletida corretamente no banco.

5. **Commit a migration**
   ```bash
   git add services/Orca.[ServiceName]/Orca.[ServiceName].Infrastructure/Migrations/
   git commit -m "feat: add migration for [feature]"
   ```

## ⚠️ Erros Comuns

### Erro: "Your target project doesn't match your migrations assembly"
**Causa**: Você está executando o comando de um projeto diferente do que contém as migrations.

**Solução**: Certifique-se de usar as flags `--project` e `--startup-project` conforme descrito acima.

### Erro: "Unable to create a DbContext"
**Causa**: O EF Core não consegue resolver as dependências do DbContext (sem Program.cs).

**Solução**: Use a flag `--startup-project` apontando para o projeto com Program.cs (a Api).

### Erro: "column [ColumnName] does not exist" no container após rebuild
**Sintoma**: Container recriado, mas queries falham com erro `42703: column does not exist` (ex: "column JsonSchema does not exist").

**Causa**: Descasamento entre código do container e schema do banco. Pode acontecer de duas formas:
1. **Container com código ANTIGO + Banco com schema NOVO**: Você aplicou migrations localmente (banco atualizou), mas o container ainda tem código antigo compilado em cache.
2. **Container com código NOVO + Banco com schema ANTIGO**: Banco criado com migrations antigas, novas migrations não foram aplicadas.

**Solução 1 - Rebuild forçado sem cache (primeira tentativa)**:
```bash
# Para e remove container
podman-compose stop [service-name]-api
podman rm orca-[service-name]-api

# Rebuild SEM cache (força recompilação completa)
podman-compose build --no-cache [service-name]-api

# Sobe container
podman-compose up -d [service-name]-api
```

**Solução 2 - Dropar volume (DESENVOLVIMENTO - perde todos dados)**:
```bash
# Para todos containers
podman-compose down

# Remove volume do Postgres (perde TODOS os dados de TODOS os serviços)
podman volume rm orca_pgdata

# Sobe tudo (vai recriar bancos com todas migrations)
podman-compose up -d
```

**Solução 3 - Dropar apenas banco específico (preserva outros serviços)**:
```bash
# Para containers
podman-compose down

# Dropa apenas o banco do serviço problemático
podman run --rm --network orca_orca-network postgres:16 \
  psql -h postgres -U orca -c "DROP DATABASE IF EXISTS orca_[servicename];"

# Exemplo para Forms:
podman run --rm --network orca_orca-network postgres:16 \
  psql -h postgres -U orca -c "DROP DATABASE IF EXISTS orca_forms;"

# Sobe containers (serviço recria banco com todas migrations)
podman-compose up -d
```

**Solução 3 - Dropar apenas banco específico (preserva outros serviços)**:
```bash
# Para containers
podman-compose down

# Dropa apenas o banco do serviço problemático
podman run --rm --network orca_orca-network postgres:16 \
  psql -h postgres -U orca -c "DROP DATABASE IF EXISTS orca_[servicename];"

# Exemplo para Forms:
podman run --rm --network orca_orca-network postgres:16 \
  psql -h postgres -U orca -c "DROP DATABASE IF EXISTS orca_forms;"

# Sobe containers (serviço recria banco com todas migrations)
podman-compose up -d
```

**Solução 4 - Verificar e corrigir manualmente (avançado - SE houver dados a preservar)**:
```bash
# 1. Verifique o schema atual do banco
podman exec -it orca-postgres psql -U orca -d orca_[servicename]
\d "TableName"  # Mostra estrutura da tabela

# 2. Verifique quais migrations foram aplicadas
SELECT "MigrationId" FROM "__EFMigrationsHistory";

# 3. Se a coluna JÁ existe mas a migration não está registrada:
INSERT INTO "__EFMigrationsHistory" ("MigrationId", "ProductVersion") 
VALUES ('[timestamp]_[MigrationName]', '8.0.0');

# 4. Se a coluna NÃO existe, execute SQL da migration manualmente
# (consulte o arquivo em Infrastructure/Migrations/[timestamp]_[name].cs)

\q
```

**Prevenção**: 
- Sempre faça rebuild com `--no-cache` após mudanças grandes no código
- O `Program.cs` aplica automaticamente migrations pendentes via `dbContext.Database.Migrate()` quando o container sobe
- Em desenvolvimento, prefira dropar volumes quando houver refatorações grandes de schema (evita estados inconsistentes)

## 🔍 Verificar Migrations Pendentes

Para listar todas as migrations que não foram aplicadas ao banco:

```bash
dotnet ef migrations list \
  --project services/Orca.[ServiceName]/Orca.[ServiceName].Infrastructure \
  --startup-project services/Orca.[ServiceName]/Orca.[ServiceName].Api
```

## 📚 Referências

- [EF Core Migrations — Documentação oficial](https://docs.microsoft.com/en-us/ef/core/managing-schemas/migrations/)
- [Design-time DbContext creation](https://docs.microsoft.com/en-us/ef/core/cli/dbcontext-creation)
