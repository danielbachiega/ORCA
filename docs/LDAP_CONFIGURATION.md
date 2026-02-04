# Configuração LDAP/Active Directory

Este guia explica como configurar a autenticação via LDAP/Active Directory no microserviço Identity.

## Modos de Operação

O sistema suporta dois modos:

### 1. **Modo MOCK** (Desenvolvimento)
- Usa credenciais hardcoded definidas no código
- **Não requer** conexão com LDAP/AD real
- Ideal para desenvolvimento local e testes

### 2. **Modo REAL** (Produção)
- Conecta ao Active Directory corporativo
- Valida credenciais reais via protocolo LDAP
- Busca grupos de usuários dinamicamente

---

## Configuração Rápida

### Para Modo MOCK (padrão):
Nenhuma configuração adicional necessária. O sistema já vem configurado com:

```bash
LDAP_USE_MOCK_MODE=true
```

**Credenciais válidas no modo mock:**
- `superadmin` / `Orca@2026`
- `admin` / `admin123`
- `editor` / `editor123`
- `consumer` / `consumer123`
- `daniel.bachiega` / `senha123`
- E outras definidas em [LdapClient.cs](../services/Orca.Identity/Orca.Identity.Infrastructure/Ldap/LdapClient.cs)

---

## Configuração para Produção (Active Directory Real)

### 1. Criar arquivo `.env` na raiz do projeto:

```bash
cp .env.example .env
```

### 2. Editar `.env` com as configurações do seu AD:

```bash
# ==========================================
# LDAP/Active Directory - Identity Service
# ==========================================

# ⚠️ IMPORTANTE: Trocar para false para usar AD real
LDAP_USE_MOCK_MODE=false

# Servidor do Active Directory (hostname ou IP)
LDAP_HOST=ad-server.empresa.com
# LDAP_HOST=192.168.1.100

# Porta (389=LDAP, 636=LDAPS com SSL)
LDAP_PORT=636

# Base DN - consulte seu administrador de rede
# Exemplo: dc=empresa,dc=com
# ou: ou=users,dc=empresa,dc=com
LDAP_BASE_DN=dc=empresa,dc=com

# Domínio (usado para DOMAIN\username)
LDAP_DOMAIN=EMPRESA

# SSL/TLS (recomendado em produção)
LDAP_USE_SSL=true

# Timeout (segundos)
LDAP_TIMEOUT=30

# Atributos LDAP (padrões para Active Directory)
LDAP_USERNAME_ATTR=sAMAccountName
LDAP_EMAIL_ATTR=mail
LDAP_GROUP_ATTR=memberOf
```

### 3. Reiniciar os containers:

```bash
podman-compose down
podman-compose up -d
```

---

## Como Descobrir Configurações do Seu AD

### **Base DN (BaseDn)**
Execute no Windows:
```cmd
dsquery * -limit 0
```

Ou consulte o administrador de rede. Exemplos comuns:
- `dc=empresa,dc=com`
- `dc=corp,dc=empresa,dc=com,dc=br`

### **Domínio**
É o nome curto do domínio Windows, geralmente visível ao fazer login:
- `DOMAIN\username` → `DOMAIN` é o valor
- Exemplo: `EMPRESA\daniel.bachiega` → `EMPRESA`

### **Porta**
- `389` - LDAP padrão (não criptografado)
- `636` - LDAPS (com SSL/TLS) - **recomendado**

---

## Estrutura de Arquivos

```
services/Orca.Identity/Orca.Identity.Infrastructure/Ldap/
├── LdapSettings.cs         # Classe de configuração
└── LdapClient.cs           # Implementação (Mock + Real)
```

---

## Fluxo de Autenticação

```
1. Frontend envia: { username, password }
   ↓
2. AuthService.LoginAsync()
   ↓
3. LdapClient.ValidateCredentialsAsync()
   ├─ [MOCK] Valida contra lista hardcoded
   └─ [REAL] Faz bind no Active Directory
   ↓
4. LdapClient.GetUserGroupsAsync()
   ├─ [MOCK] Retorna grupos predefinidos
   └─ [REAL] Busca grupos do AD via atributo "memberOf"
   ↓
5. RoleRepository.GetByLdapGroupAsync()
   ↓
6. Mapeia grupos → Roles
   ↓
7. Gera JWT com roles
   ↓
8. Retorna: { sessionToken, user, roles }
```

---

## Mapeamento Grupos → Roles

Configurado no banco de dados ([IdentityContext.cs](../services/Orca.Identity/Orca.Identity.Infrastructure/IdentityContext.cs)):

| Role | Grupos LDAP Aceitos | Access Type |
|------|---------------------|-------------|
| **Admin** | `Admins`, `TI` | Admin + Editor + Consumer |
| **Editor** | `Editors`, `Developers` | Editor + Consumer |
| **Consumer** | `Users` | Consumer |

**Exemplo:**
- Usuário `daniel.bachiega` tem grupos AD: `TI`, `Admins`, `Developers`
- Sistema mapeia para roles: `Admin` (por ter `TI` ou `Admins`) + `Editor` (por ter `Developers`)
- JWT gerado contém: `["Admin", "Editor"]`

---

## Troubleshooting

### Erro: "Credenciais inválidas" no modo REAL

**Possíveis causas:**
1. **Base DN incorreto** - Verifique com o administrador
2. **Domínio errado** - Deve ser o nome NETBIOS (ex: `EMPRESA`)
3. **Firewall bloqueando** - Porta 389/636 deve estar aberta
4. **SSL obrigatório** - Alguns ADs exigem SSL, configure `LDAP_USE_SSL=true`

**Como testar conexão:**
```bash
# Testar se o servidor LDAP está acessível
nc -zv ldap-server.empresa.com 389

# Testar bind manual (Linux)
ldapsearch -x -H ldap://ldap-server.empresa.com:389 \
  -D "DOMAIN\\username" -W \
  -b "dc=empresa,dc=com"
```

### Grupos não sendo encontrados

Verifique o atributo de grupos:
- **Active Directory:** Use `memberOf`
- **OpenLDAP:** Use `memberOf` ou `gidNumber`
- **Outros:** Consulte documentação do servidor LDAP

### Logs para diagnóstico

O LdapClient gera logs detalhados:

```bash
# Ver logs do container Identity
podman logs -f orca-identity-api

# Procurar por:
# ✅ [REAL] Credenciais LDAP válidas
# ❌ [REAL] Erro LDAP ao validar credenciais
# 🔐 [REAL] Validando credenciais LDAP
```

---

## Segurança

### ⚠️ Importantes:

1. **Nunca commitar arquivo `.env`** com credenciais reais
2. **Usar SSL/TLS em produção** (`LDAP_USE_SSL=true`)
3. **Validar certificados** em produção (atualmente aceita qualquer certificado)
4. **Bind Service Account** (futuro): Usar conta de serviço dedicada para buscas LDAP

### Melhorias Futuras:

```csharp
// Adicionar em LdapSettings.cs:
public string? ServiceAccountDn { get; set; }  // Para bind de leitura
public string? ServiceAccountPassword { get; set; }

// Usar para buscas (em vez de bind anônimo)
var credential = new NetworkCredential(
    _settings.ServiceAccountDn, 
    _settings.ServiceAccountPassword
);
connection.Bind(credential);
```

---

## Suporte

Dúvidas sobre configuração LDAP/AD? Entre em contato com:
- **Equipe de Infraestrutura** - para configurações de rede/firewall
- **Administrador de Active Directory** - para Base DN, domínio e permissões
- **Equipe de Desenvolvimento** - para questões sobre o código

---

## Referências

- [System.DirectoryServices.Protocols Documentation](https://learn.microsoft.com/en-us/dotnet/api/system.directoryservices.protocols)
- [Active Directory LDAP Syntax](https://learn.microsoft.com/en-us/windows/win32/adsi/search-filter-syntax)
- [RFC 4511 - LDAP Protocol](https://tools.ietf.org/html/rfc4511)
