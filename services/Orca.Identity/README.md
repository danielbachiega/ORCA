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
1. Frontend → POST /api/auth/login { username, password }
                          ↓
2. LdapClient.ValidateCredentialsAsync(username, password)
   └─ Valida credenciais no LDAP/AD
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
| `POST` | `/api/auth/login` | Login com username/password |
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
- **Password:** `Orca@2026`
- **Email:** `admin@orca.local`
- **Roles:** Admin (com todos os acessos)
- **Grupos LDAP:** Admins

**Credenciais de Teste:**
| Username | Password | Roles |
|----------|----------|-------|
| `superadmin` | `Orca@2026` | Admin |
| `admin` | `admin123` | Admin |
| `editor` | `editor123` | Editor |
| `consumer` | `consumer123` | Consumer |

**Como logar via cURL:**

```bash
curl -X POST http://localhost:5002/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "username": "superadmin",
    "password": "Orca@2026"
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

> ⚠️ **Ambiente com LDAP real:** para manter `superadmin` e `admin` funcionando sem depender do AD,
> configure as variáveis `LOCAL_SUPERADMIN_PASSWORD` e `LOCAL_ADMIN_PASSWORD` no compose (podman-compose).
> Se estiverem vazias, o fallback local é desativado.

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

#### ✅ Atualização: Service Account para consultar grupos

Para ambientes corporativos (AD real), agora usamos **service account** para buscar grupos do usuário, pois bind anônimo costuma ser bloqueado. Configure no appsettings e/ou variáveis de ambiente:

- `Ldap:ServiceAccountDn`
- `Ldap:ServiceAccountPassword`

Exemplo de configuração está em [services/Orca.Identity/Orca.Identity.Api/appsettings.json](services/Orca.Identity/Orca.Identity.Api/appsettings.json).

### Variáveis de ambiente (compose)

```bash
# Ativar/desativar mock LDAP
LDAP_USE_MOCK_MODE=true

# Servidor LDAP/AD
LDAP_HOST=10.100.12.20
LDAP_PORT=389
LDAP_BASE_DN=OU=Usuarios,OU=BRA-SP,OU=BMFBovespa,DC=corporate,DC=int
LDAP_DOMAIN=CORPORATE

# Service Account (recomendado)
LDAP_SERVICE_ACCOUNT_DN=CN=_svcmonitoringIACP,OU=Contas de Servico,OU=Contas de Infraestrutura,OU=Gerenciamento,OU=BMFBovespa,DC=corporate,DC=int
LDAP_SERVICE_ACCOUNT_PASSWORD=change_me

# SSL/TLS e timeouts
LDAP_USE_SSL=false
LDAP_TIMEOUT=30

# Atributos LDAP
LDAP_USERNAME_ATTR=sAMAccountName
LDAP_EMAIL_ATTR=mail
LDAP_GROUP_ATTR=memberOf

# Fallback de usuários locais (LDAP real)
LOCAL_SUPERADMIN_PASSWORD=superadmin1234
LOCAL_ADMIN_PASSWORD=admin321
```

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

## 🧩 Mapeamento de Grupos Corporativos (CN completos → Roles)

No seu ambiente, os grupos do AD chegam como **DN completo** (ex.: `CN=G-APL_ARTIS_P-SP,OU=Artis,OU= Grupos de Aplicacoes,OU=Gerenciamento,OU=BMFBovespa,DC=corporate,DC=int`).

Como o nosso sistema permite criar roles dinâmicas, o mapeamento fica assim:

1. Crie roles no banco com o campo `LdapGroups` contendo os **CNs** reais dos grupos do AD.
2. No login, o LDAP retorna todos os grupos do usuário.
3. O sistema associa automaticamente as roles cadastradas aos grupos que o usuário possui.

### Exemplo prático (com os grupos do seu ambiente)

**Grupos corporativos relevantes:**
- `CN=G-APL_ARTIS_P-SP,OU=Artis,OU= Grupos de Aplicacoes,OU=Gerenciamento,OU=BMFBovespa,DC=corporate,DC=int`
- `CN=G-APL_ARTIS_READONLY_P-SP,OU=Artis,OU= Grupos de Aplicacoes,OU=Gerenciamento,OU=BMFBovespa,DC=corporate,DC=int`

**Sugestão de roles dinâmicas:**
- **Admin** → vincular ao CN `G-APL_ARTIS_P-SP`
- **Consumer** → vincular ao CN `G-APL_ARTIS_READONLY_P-SP`

### Como cadastrar essas roles

Você pode criar (ou atualizar) as roles via endpoint `/api/roles` incluindo o CN completo no campo `ldapGroups`.

> Dica: se quiser mapear vários grupos para a mesma role, basta adicionar todos os CNs no `ldapGroups`.

### Observação importante

Se o seu AD retornar **apenas o CN** (ex.: `G-APL_ARTIS_P-SP`) em vez do DN completo, ajuste o campo `LdapGroups` para usar somente o CN. Já se o AD retornar o DN completo, mantenha o DN completo no cadastro das roles.

Para conferir o que está chegando, verifique os logs do Identity após um login válido.

---

## 🛠️ Nota de Ambiente (Rede/DNS)

Durante o teste em ambiente corporativo, foi necessário ajustar a preferência de IPv4 para o .NET conseguir resolver o NuGet. O ajuste foi feito no arquivo [etc/gai.conf](etc/gai.conf) com a linha:

`precedence ::ffff:0:0/96 100`

Se houver falhas de restore semelhantes, verifique esse ajuste de rede/DNS.

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
