# 🛡️ Orca.Identity Service

## Visão Geral

O Orca.Identity é o serviço responsável por autenticação, autorização e resolução de roles dinâmicas no ORCA, integrando OIDC, LDAP (Windows AD) e RBAC customizável. Ele segue Clean Architecture (Domain/Application/Infrastructure/Api) e permite:

- Login via OIDC (mock ou provedor real)
- Consulta de grupos do usuário no AD via LDAP
- Mapeamento dinâmico de grupos AD para roles internas (persistidas no banco)
- CRUD de roles (nome, grupos AD vinculados, tipo de acesso, ofertas visíveis)
- Gestão de sessão e cache de claims
- Endpoints REST: login, logout, user info

---

## Arquitetura

```
API (Controllers)
  └─ Application (Services, DTOs)
      └─ Infrastructure (LdapClient, UserRepository)
          └─ Domain (Entities: User, Role, OfferRole)
```

- **User**: representa o usuário autenticado, suas roles e grupos AD
- **Role**: role interna do ORCA, vinculada a grupos AD e ofertas visíveis
- **OfferRole**: join entre Offer e Role (ofertas visíveis por role)

---

## Fluxo de Login

1. Frontend envia OIDC idToken para `/auth/login`
2. API valida token (mock: extrai claims)
3. Consulta LDAP para obter grupos AD do usuário
4. Busca roles no banco e verifica quais grupos AD do usuário batem com as roles cadastradas
5. Monta lista de roles do usuário
6. Gera JWT de sessão com claims
7. Retorna LoginResponseDto (sessionToken, user, expiresAt)

---

## CRUD de Roles

- Admin pode criar/editar roles:
  - Nome da role
  - Lista de grupos AD vinculados (um ou mais)
  - Tipo de acesso (Admin, Editor, Consumer)
  - Ofertas visíveis (seleção N:N)
- Permite RBAC dinâmico e flexível, sem hardcode

---

## Exemplo de Entidade Role

```csharp
public class Role
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public List<string> LdapGroups { get; set; } = new();
    public RoleAccessType AccessType { get; set; }
    public ICollection<OfferRole> Offers { get; set; } = new List<OfferRole>();
}

public enum RoleAccessType
{
    Admin,
    Editor,
    Consumer
}
```

---

## Endpoints

- `POST /auth/login` — Login OIDC + LDAP
- `GET /auth/me` — Dados do usuário autenticado
- `POST /auth/logout` — Logout
- `GET/POST/PUT/DELETE /roles` — CRUD de roles

---

## Passo a Passo de Implementação

1. **Domain**: Criar entidades User, Role, OfferRole
2. **Application**: DTOs, interfaces, serviços de autenticação e roles
3. **Infrastructure**: LdapClient, UserRepository, persistência
4. **Api**: Controllers para auth e roles
5. **Testes**: Validar fluxo de login, roles dinâmicas e visibilidade de ofertas

---

## Observações

- O mapeamento de roles é dinâmico: basta cadastrar uma nova role e vincular grupos AD para que usuários desses grupos recebam a role automaticamente no login.
- O tipo de acesso da role controla permissões administrativas na plataforma.
- A visibilidade das ofertas é controlada por role, permitindo cenários avançados de RBAC.

---

## Roadmap Futuro

- Integração real com OIDC
- UI de administração de roles
- Auditoria de acessos e alterações de roles
- Cache distribuído para sessões
