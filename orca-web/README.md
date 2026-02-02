# 🚀 ORCA Web Frontend

Next.js 14 com **App Router**, **Ant Design**, **TanStack Query** e **arquitetura clean**.

## 🏗️ Arquitetura

```
src/
├── app/                    # Next.js App Router (páginas)
│   ├── layout.tsx         # Root layout com providers
│   ├── page.tsx           # Home (redireciona pra login/dashboard)
│   ├── login/             # Página de autenticação
│   └── dashboard/         # Dashboard protegido
│
├── lib/                    # Domain & Infrastructure
│   ├── contexts/          # React Contexts (Auth)
│   ├── types/             # TypeScript interfaces centralizadas
│   ├── constants/         # API URLs, storage keys, labels
│   ├── utils/             # ApiClient abstrato, QueryClient
│   └── providers.tsx      # Wrapper de providers globais
│
├── services/              # Application Layer
│   ├── identity.service.ts    # Login, logout, me
│   ├── catalog.service.ts     # Ofertas CRUD
│   ├── requests.service.ts    # Requisições do usuário
│   └── index.ts               # Barrel exports
│
└── components/            # Reusable UI
    ├── protected-route.tsx    # Proteção de rotas
    └── app-header.tsx         # Header com user info
```

## 🎯 Stack Técnico

- **Next.js 14** - React framework com App Router
- **TypeScript** - Type safety estrito
- **Ant Design** - Componentes UI profissionais
- **TanStack Query** - Gerenciamento de cache/dados da API
- **React Context API** - Autenticação e estado
- **Axios** - HTTP client
- **Tailwind CSS** - Styling

## 🔐 Autenticação

### Fluxo
```
1. Usuário preenche username + password
2. Frontend POST /api/auth/login
3. Identity valida credenciais em LDAP
4. Retorna sessionToken + user + roles
5. Frontend salva em localStorage e estado (Context)
6. Todas requisições têm Authorization: Bearer {token}
```

### Credenciais de Teste
```
superadmin / Orca@2026
admin / admin123
editor / editor123
consumer / consumer123
```

## 🚀 Como Executar

### Development
```bash
npm run dev
# http://localhost:3000
```

### Production Build
```bash
npm run build
npm run start
```

### Docker
```bash
docker build -t orca-web .
docker run -p 3000:3000 orca-web
```

## 📝 Principais Componentes

### LoginPage (`/login`)
- Form username + password
- Integração com `identityService.login()`
- Exibe credenciais de teste

### Dashboard (`/dashboard`)
- Protegido por `<ProtectedRoute>`
- Lista de ofertas com TanStack Query
- Grid de cards com detalhes

### AppHeader
- Exibe usuário logado + roles
- Dropdown com logout
- Navegação pra home

## 🔌 Camada de API Abstrata

**Por quê abstrata?**
- Hoje: localhost:5001-5005 (direto nos microserviços)
- Amanhã: localhost:3000/api (gateway/BFF)
- Mudando AQUI = 1 arquivo, não 50 componentes!

```typescript
// ApiClient genérico
const client = new ApiClient({ baseURL: 'http://localhost:5002' });
await client.get<User>('/api/auth/me');

// Services usam ApiClient
export class IdentityService {
  async login(username: string, password: string) {
    return this.client.post('/api/auth/login', { username, password });
  }
}
```

## 🎨 Decisões Arquiteturais

| Decisão | Por Quê | Benefício |
|---------|---------|-----------|
| **ApiClient Abstrato** | Facilita migração pra Gateway | Baixo acoplamento |
| **Context API** | Autenticação = 1 estado simples | Sem overhead Redux |
| **TanStack Query** | Gerencia server state | Cache automático |
| **TypeScript Estrito** | Backend .NET é tipado | Erros em dev time |
| **Ant Design** | Full library + profissional | Componentes prontos |

## 📚 Configuração

### Environment Variables
```bash
NEXT_PUBLIC_IDENTITY_API=http://localhost:5002
NEXT_PUBLIC_CATALOG_API=http://localhost:5001
NEXT_PUBLIC_REQUESTS_API=http://localhost:5004
NEXT_PUBLIC_ORCHESTRATOR_API=http://localhost:5005
```

## 🔄 Próximas Etapas

- [ ] Página de detalhes da oferta
- [ ] Formulário dinâmico (JSON Schema + Uniforms)
- [ ] Submissão de requisição
- [ ] Listagem de minhas requisições
- [ ] Admin: CRUD de ofertas
- [ ] Designer de formulários visual
- [ ] Mapeamento LDAP groups → roles

## 🧪 Testes

```bash
npm run lint      # ESLint
npm run build     # Type check + build
```

## 📖 Documentação Relacionada

- [Identity Service](../services/Orca.Identity/README.md) - Autenticação e RBAC
- [Catalog Service](../services/Orca.Catalog/README.md) - Ofertas
- [Requests Service](../services/Orca.Requests/README.md) - Solicitações
