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
