# 🛡️ Orca.Identity Service

## 🎯 Visão Geral

O Orca.Identity é o serviço responsável por **autenticação, autorização e resolução de roles dinâmicas** no ORCA. Ele integra:

- ✅ **OIDC** (mock ou provedor real: Auth0, Azure AD, Google, etc)
- ✅ **LDAP** (mock ou Active Directory corporativo)
- ✅ **RBAC Customizável** com mapeamento dinâmico de grupos → roles
- ✅ **JWT de Sessão** com claims de roles
- ✅ **CRUD de Roles** com persistência no PostgreSQL

## 🏗️ Arquitetura Clean

```
┌─────────────────────────┐
│    API Layer (REST)     │  ← Controllers, Middleware, Program.cs
├─────────────────────────┤
│  Application Layer      │  ← Services, DTOs, Interfaces
├─────────────────────────┤
│  Infrastructure Layer   │  ← DbContext, Repositories, LDAP, OIDC
├─────────────────────────┤
│   Domain Layer (Core)   │  ← Entities, Enums, Business Rules
└─────────────────────────┘
```

**Benefícios:**
- 🔄 **Independente de BD**: trocar PostgreSQL por SQL Server sem alterar Application
- 🔌 **Independente de LDAP**: mockar para testes, trocar para AD real em produção
- 🧪 **Testável**: cada camada isolada, fácil mockar dependências

---

## 📋 Entidades Principais

### **Role** (Função/Grupo)
```csharp
public class Role
{
    public Guid Id { get; set; }
    public string Name { get; set; }              // "Admin", "Editor", "Consumer"
    public string Description { get; set; }      // "Administradores do sistema"
    public List<string> LdapGroups { get; set; } // ["Admins", "TI"] - grupos AD vinculados
    public RoleAccessType AccessType { get; set; }
}

[Flags]
public enum RoleAccessType
{
    None = 0,
    Consumer = 1,  // Pode solicitar execuções
    Admin = 2,     // Pode criar e gerenciar roles
    Editor = 4     // Pode criar ofertas
}
```

### **User** (Usuário Autenticado)
```csharp
public class User
{
    public Guid Id { get; set; }
    public string Username { get; set; }           // Do OIDC
    public string Email { get; set; }
    public List<string> LdapGroups { get; set; }   // Grupos do AD
    public List<Guid> RoleIds { get; set; }        // Roles mapeadas
    public DateTime LastLoginAtUtc { get; set; }   // Auditoria
    public bool IsActive { get; set; }
}
```

## 🚀 Fluxo de Login

```
1. Frontend → POST /api/auth/login { idToken }
                          ↓
2. OidcValidator.ValidateTokenAsync()
   └─ Decodifica JWT e extrai: username, email, sub
                          ↓
3. LdapClient.GetUserGroupsAsync(username)
   └─ Consulta LDAP/AD → retorna grupos do usuário
                          ↓
4. RoleRepository.GetByLdapGroupAsync()
   └─ Para cada grupo LDAP, busca roles cadastradas
                          ↓
5. UserRepository.AddAsync() ou UpdateAsync()
   └─ Salva/atualiza usuário com roles mapeadas
                          ↓
6. SessionTokenGenerator.GenerateToken()
   └─ Cria JWT de sessão com claims de roles
                          ↓
7. Retorna LoginResponseDto
   └─ sessionToken, user (info + roles), expiresAt
```

---

## 🔐 Endpoints REST

### **Autenticação**

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `POST` | `/api/auth/login` | Login com OIDC token |
| `GET` | `/api/auth/me?userId={id}` | Info do usuário autenticado |
| `POST` | `/api/auth/logout` | Logout |

### **Roles**

| Método | Endpoint | Descrição |
|--------|----------|-----------|
| `GET` | `/api/roles` | Lista todas as roles |
| `GET` | `/api/roles/{id:guid}` | Busca role por ID |
| `GET` | `/api/roles/by-name/{name}` | Busca role por nome |
| `GET` | `/api/roles/by-ldap-group/{ldapGroup}` | Busca roles por grupo LDAP |
| `POST` | `/api/roles` | Cria nova role |
| `PUT` | `/api/roles/{id:guid}` | Atualiza role |
| `DELETE` | `/api/roles/{id:guid}` | Deleta role |

---

## 🧪 Como Testar

### 1️⃣ Login com SuperAdmin (Usuário Local)

Este é o usuário padrão criado no banco de dados. Perfeito para **primeiro login e testes**.

**Dados do SuperAdmin:**
- **Username:** `superadmin`
- **Email:** `admin@orca.local`
- **Roles:** Admin (com todos os acessos)
- **Grupos LDAP:** Admins

**Como logar:**

```bash
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "idToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJwcmVmZXJyZWRfdXNlcm5hbWUiOiJzdXBlcmFkbWluIiwiZW1haWwiOiJhZG1pbkBvcmNhLmxvY2FsIiwic3ViIjoic3VwZXJhZG1pbiJ9.mock"
  }'
```

**Resposta (200 OK):**
```json
{
  "sessionToken": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": "99999999-9999-9999-9999-999999999999",
    "username": "superadmin",
    "email": "admin@orca.local",
    "roles": [
      {
        "id": "11111111-1111-1111-1111-111111111111",
        "name": "Admin",
        "accessType": "Consumer, Admin, Editor"
      }
    ],
    "ldapGroups": ["Admins"]
  },
  "expiresAtUtc": "2026-02-02T19:09:44Z"
}
```

**Use o `sessionToken` em chamadas autenticadas como header:**
```bash
Authorization: Bearer {sessionToken}
```

---

### 2️⃣ CRUD de Roles

**Listar todas as roles:**
```bash
curl -X GET http://localhost:5002/api/roles
```

**Criar nova role:**
```bash
curl -X POST http://localhost:5002/api/roles \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Viewer",
    "description": "Apenas visualização",
    "ldapGroups": ["Viewers"],
    "accessType": 1
  }'
```

**Atualizar role:**
```bash
curl -X PUT http://localhost:5002/api/roles/33333333-3333-3333-3333-333333333333 \
  -H "Content-Type: application/json" \
  -d '{
    "id": "33333333-3333-3333-3333-333333333333",
    "name": "Consumer Updated",
    "description": "Usuários que consomem ofertas",
    "ldapGroups": ["Users", "Customers"],
    "accessType": 1
  }'
```

**Deletar role:**
```bash
curl -X DELETE http://localhost:5002/api/roles/33333333-3333-3333-3333-333333333333
```

---

## ⚙️ Configuração de LDAP (Para Testes Reais)

### 🔧 Estrutura Atual (Mock)

O `LdapClient` está em **mock** retornando grupos fictícios baseado no username:

```csharp
public async Task<List<string>> GetUserGroupsAsync(string username)
{
    // Mock: retorna grupos diferentes por username
    var mockGroups = username switch
    {
        "admin" => new List<string> { "Admins", "TI", "Developers" },
        "editor" => new List<string> { "Editors", "Developers" },
        "consumer" => new List<string> { "Users" },
        _ => new List<string> { "Users" }
    };
    return mockGroups;
}
```

### 🔌 Integrar com Active Directory Real

Para usar um **Active Directory corporativo**, siga estes passos:

#### **Passo 1: Instalar pacote LDAP**

```bash
cd services/Orca.Identity/Orca.Identity.Infrastructure
dotnet add package System.DirectoryServices
dotnet add package System.DirectoryServices.AccountManagement
```

#### **Passo 2: Atualizar `LdapClient.cs`**

Substitua o mock por implementação real:

```csharp
using System.DirectoryServices;
using System.DirectoryServices.AccountManagement;
using Orca.Identity.Domain.Ldap;

namespace Orca.Identity.Infrastructure.Ldap;

public class LdapClient : ILdapClient
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<LdapClient> _logger;

    public LdapClient(IConfiguration configuration, ILogger<LdapClient> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public async Task<List<string>> GetUserGroupsAsync(string username)
    {
        try
        {
            var adServer = _configuration["LDAP:Server"] ?? "ldap.example.com";
            var domain = _configuration["LDAP:Domain"] ?? "example.com";
            
            using (var context = new PrincipalContext(ContextType.Domain, adServer, domain))
            {
                var userPrincipal = UserPrincipal.FindByIdentity(context, IdentityType.SamAccountName, username);
                
                if (userPrincipal == null)
                {
                    _logger.LogWarning("Usuário {Username} não encontrado no LDAP", username);
                    return new List<string>();
                }

                var groups = userPrincipal.GetAuthorizationGroups()
                    .Cast<GroupPrincipal>()
                    .Select(g => g.Name)
                    .ToList();

                _logger.LogInformation("Usuário {Username} encontrado com {GroupCount} grupos", username, groups.Count);
                return groups;
            }
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao consultar LDAP para usuário {Username}", username);
            return new List<string>();
        }
    }
}
```

#### **Passo 3: Configurar `appsettings.json`**

Adicione as credenciais do AD:

```json
{
  "LDAP": {
    "Server": "ldap.example.com",
    "Domain": "example.com",
    "AdminUser": "admin@example.com",
    "AdminPassword": "senha-secura"
  }
}
```

#### **Passo 4: Registrar no DI**

No `ServiceCollectionExtensions.cs`:

```csharp
// Antes (mock)
services.AddScoped<ILdapClient, LdapClient>();

// Depois (real)
// Já registra automaticamente quando você chama AddScoped<ILdapClient, LdapClient>
// O construtor recebe IConfiguration injetado automaticamente
```

#### **Passo 5: Mapear Grupos AD → Roles**

Crie roles no banco vinculadas aos grupos AD reais:

```bash
curl -X POST http://localhost:5002/api/roles \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Developers",
    "description": "Time de desenvolvimento",
    "ldapGroups": ["CN=DEV-TEAM,OU=Groups,DC=example,DC=com"],
    "accessType": 6
  }'
```

Agora quando um usuário com grupo "DEV-TEAM" logar, receberá automaticamente a role "Developers".

---

## 📊 Seed de Dados Padrão

Ao iniciar, essas roles são criadas automaticamente:

| ID | Nome | Grupos LDAP | Acesso |
|----|----|-----------|--------|
| `11111111...` | **Admin** | Admins, TI | Consumer + Admin + Editor |
| `22222222...` | **Editor** | Editors, Developers | Consumer + Editor |
| `33333333...` | **Consumer** | Users | Consumer |

E um usuário de teste:

| ID | Username | Email | Grupos | Roles |
|----|----|--------|--------|-------|
| `99999999...` | **superadmin** | admin@orca.local | Admins | Admin |

---

## 🛠️ Stack Técnico

- **.NET 8** - Runtime
- **PostgreSQL 16** - Banco de dados
- **Entity Framework Core 8** - ORM
- **System.DirectoryServices** - LDAP/AD
- **System.IdentityModel.Tokens.Jwt** - JWT
- **FluentValidation** - Validação de DTOs
- **Swagger/OpenAPI** - Documentação

---

## 📁 Estrutura de Projeto

```
Orca.Identity/
├── Domain/
│   ├── Entities/
│   │   ├── Role.cs
│   │   └── User.cs
│   ├── Repositories/
│   │   ├── IRoleRepository.cs
│   │   └── IUserRepository.cs
│   ├── Auth/
│   │   ├── IOidcValidator.cs
│   │   └── OidcClaims.cs
│   └── Ldap/
│       └── ILdapClient.cs
│
├── Application/
│   ├── Auth/
│   │   ├── AuthService.cs
│   │   ├── AuthDtos.cs
│   │   ├── IAuthService.cs
│   │   └── ISessionTokenGenerator.cs
│   └── Roles/
│       ├── RoleService.cs
│       ├── RoleDtos.cs
│       ├── IRoleService.cs
│       └── Mappings.cs
│
├── Infrastructure/
│   ├── IdentityContext.cs
│   ├── Repositories/
│   │   ├── RoleRepository.cs
│   │   └── UserRepository.cs
│   ├── Auth/
│   │   ├── OidcValidator.cs
│   │   └── SessionTokenGenerator.cs
│   ├── Ldap/
│   │   └── LdapClient.cs
│   ├── Migrations/
│   │   └── 20260202173607_InitialCreate.cs
│   └── Extensions/
│       └── ServiceCollectionExtensions.cs
│
└── Api/
    ├── Controllers/
    │   ├── RolesController.cs
    │   └── AuthController.cs
    ├── Middleware/
    │   └── GlobalExceptionHandler.cs
    ├── Program.cs
    ├── appsettings.json
    └── Dockerfile
```
