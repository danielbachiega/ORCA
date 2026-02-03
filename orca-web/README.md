# 🚀 ORCA Web Frontend

Frontend moderno do ORCA - Sistema de Orquestração de Requisições de Catálogo Automatizado.

Built with Next.js 14, TypeScript, Ant Design e Clean Architecture.

## 📋 Índice

- [Visão Geral](#visão-geral)
- [Stack Tecnológico](#stack-tecnológico)
- [Arquitetura](#arquitetura)
- [Quick Start](#quick-start)
- [Funcionalidades](#funcionalidades)
- [Documentação](#documentação)

## 🎯 Visão Geral

O ORCA Web é o frontend da plataforma ORCA, permitindo que usuários:

- **Consumidores**: Naveguem ofertas e criem requisições
- **Editores**: Gerenciem ofertas e formulários
- **Admins**: Controlem acessos, roles e configurações

### Features Implementadas ✅

- ✅ Autenticação LDAP com sessão JWT + persistência em localStorage
- ✅ Dashboard com listagem de ofertas role-based
- ✅ Detalhes de ofertas
- ✅ Criação de requisições com field mapping
- ✅ Listagem de minhas requisições com filtro por usuário
- ✅ Página de detalhes de requisição com auto-refresh
- ✅ Admin: Criar/Editar/Deletar ofertas
- ✅ Admin: Gerenciar roles (CRUD, search, paginação, modal)
- ✅ Admin: Controle de visibilidade de ofertas por roles
- ✅ User: Página de perfil (info, roles, grupos LDAP)
- ✅ Protected routes com RBAC
- ✅ Error handling e loading states
- ✅ Cache inteligente com TanStack Query
- ✅ ExecutionTemplate com mapeamento visual de payload
- ✅ Suporte para string/número em accessType

### Em Desenvolvimento 🚧

- 🚧 Designer de formulários visual (JSON Schema) - Backend pronto, frontend em desenvolvimento
- 🚧 Renderização dinâmica de formulários via JSON Schema
- 🚧 Integração visual com AWX/OO (endpoints já implementados)
- 🚧 Histórico de execuções detalhado
- 🚧 Dashboard analytics com métricas
- 🚧 Export de dados (CSV/JSON)

## 💻 Stack Tecnológico

### Core
- **Next.js 14.2+** - React framework com App Router
- **TypeScript 5+** - Type safety com strict mode
- **React 18+** - Latest features (Suspense, Server Components)

### UI/UX
- **Ant Design 5.x** - Biblioteca de componentes enterprise
- **Tailwind CSS 3.x** - Utility-first CSS
- **Lucide Icons** - Icon system

### State Management
- **TanStack Query v5** - Server state management
- **React Context API** - Client state (auth)

### HTTP & APIs
- **Axios** - HTTP client
- **ApiClient Pattern** - Abstração sobre microserviços

### Development
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **TypeScript Strict** - Zero type errors

## 🏗️ Arquitetura

Implementamos **Clean Architecture** adaptada para React/Next.js:

```
src/
├── app/                           # 📱 Presentation Layer (Next.js App Router)
│   ├── layout.tsx                # Root layout com providers
│   ├── page.tsx                  # Home → redirect
│   ├── login/                    # Autenticação
│   │   └── page.tsx
│   └── dashboard/                # Features protegidas
│       ├── page.tsx              # Lista de ofertas
│       ├── offers/
│       │   └── [id]/
│       │       ├── page.tsx      # Detalhes da oferta
│       │       └── request/
│       │           └── page.tsx  # Criar requisição
│       ├── requests/
│       │   └── page.tsx          # Minhas requisições
│       └── admin/
│           └── offers/
│               ├── new/
│               │   └── page.tsx  # Criar oferta
│               └── [id]/
│                   └── edit/
│                       └── page.tsx # Editar oferta
│
├── components/                    # 🧩 Reusable UI Components
│   ├── app-header.tsx            # Header com navegação
│   ├── protected-route.tsx       # RBAC wrapper
│   ├── features/                 # Feature-specific components
│   ├── layouts/                  # Layout components
│   └── ui/                       # Generic UI components
│
├── services/                      # 🔌 Application Layer
│   ├── index.ts                  # Barrel exports
│   ├── identity.service.ts       # Auth & Users
│   ├── catalog.service.ts        # Ofertas CRUD
│   ├── requests.service.ts       # Requisições
│   └── api/                      # Service implementations
│
├── lib/                           # 🏛️ Domain & Infrastructure
│   ├── types/                    # Domain models
│   │   └── index.ts              # Centralized types
│   ├── contexts/                 # React Contexts
│   │   └── auth.context.tsx     # Auth state
│   ├── constants/                # Configuration
│   │   └── index.ts              # API URLs, keys
│   ├── utils/                    # Infrastructure
│   │   ├── api-client.ts         # HTTP abstraction
│   │   └── query-client.ts       # TanStack Query config
│   └── providers.tsx             # Global providers wrapper
│
└── hooks/                         # 🎣 Custom React Hooks
    └── (future: useDebounce, useLocalStorage, etc)
```

### Camadas e Responsabilidades

#### 1. **Presentation Layer** (`/app`)
- Next.js pages e layouts
- Renderização de UI
- Navegação e roteamento
- **Regra**: Não faz lógica de negócio, apenas orquestra components e services

#### 2. **Application Layer** (`/services`)
- Lógica de negócio
- Comunicação com APIs
- Transformação de dados
- **Regra**: Usa ApiClient, retorna tipos do Domain

#### 3. **Domain Layer** (`/lib/types`)
- Modelos de domínio (interfaces TypeScript)
- Regras de negócio puras
- **Regra**: Zero dependência externa

#### 4. **Infrastructure Layer** (`/lib/utils`, `/lib/contexts`)
- ApiClient HTTP
- Query client config
- Context providers
- **Regra**: Implementações técnicas, substituíveis

## 🚀 Quick Start

### Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Backend APIs rodando (Identity, Catalog, Requests)

### Instalação

```bash
# Clone o repositório
git clone <repo-url>
cd orca-web

# Instale dependências
npm install

# Configure variáveis de ambiente
cp .env.example .env.local
# Edite .env.local com as URLs dos microserviços

# Execute em desenvolvimento
npm run dev
```

Acesse: http://localhost:3000

### Build de Produção

```bash
npm run build
npm run start
```

### Docker

```bash
docker build -t orca-web .
docker run -p 3000:3000 orca-web
```

## 🔐 Autenticação

### Fluxo de Login

```
┌─────────┐      POST /api/auth/login       ┌──────────┐
│ Browser │ ──────────────────────────────> │ Identity │
│         │  { username, password }          │   API    │
└─────────┘                                  └──────────┘
     │                                            │
     │         ┌──────────────────────────────────┘
     │         │ Valida LDAP, busca roles
     │         └──────────────────────────────────┐
     │                                            │
     │    { sessionToken, user, roles }          ▼
     │ <──────────────────────────────────  ┌──────────┐
     │                                       │   LDAP   │
     │                                       └──────────┘
     ▼
┌─────────────────────────────────────┐
│ 1. Salva token em localStorage      │
│ 2. Salva user/roles em Context      │
│ 3. ApiClient injeta em Authorization│
└─────────────────────────────────────┘
```

### Credenciais de Teste

| Username | Password | Roles | Acesso |
|----------|----------|-------|--------|
| superadmin | Orca@2026 | Admin, Editor, Consumer | Total - Criar/editar ofertas e roles |
| admin | admin123 | Admin, Editor, Consumer | Criar e editar ofertas, gerenciar roles |
| editor | editor123 | Editor, Consumer | Criar ofertas, ver consumidor |
| consumer | consumer123 | Consumer | Ver e requisitar ofertas |

**Nota:** As credenciais são validadas via **LDAP** no backend. Em desenvolvimento, use as credenciais acima. Em produção, será integrado com Windows Active Directory.

### Proteção de Rotas

```tsx
// Qualquer usuário autenticado
<ProtectedRoute>
  <DashboardPage />
</ProtectedRoute>

// Apenas admin/superadmin
<ProtectedRoute requiredRoles={['admin', 'superadmin']}>
  <CreateOfferPage />
</ProtectedRoute>
```

## 📚 Documentação

Para guias detalhados, consulte:

- **[ARCHITECTURE.md](./docs/ARCHITECTURE.md)** - Arquitetura completa e padrões
- **[DEVELOPMENT_GUIDE.md](./docs/DEVELOPMENT_GUIDE.md)** - Como desenvolver novas features
- **[API_ABSTRACTION.md](./docs/API_ABSTRACTION.md)** - ApiClient e Services
- **[COMPONENTS.md](./docs/COMPONENTS.md)** - Guia de componentes
- **[TROUBLESHOOTING.md](./docs/TROUBLESHOOTING.md)** - Resolução de problemas comuns
- **[TESTING.md](./docs/TESTING.md)** - Guia de testes

## 🌐 Environment Variables

```bash
# APIs Backend
NEXT_PUBLIC_IDENTITY_API=http://localhost:5002
NEXT_PUBLIC_CATALOG_API=http://localhost:5001
NEXT_PUBLIC_REQUESTS_API=http://localhost:5004
NEXT_PUBLIC_ORCHESTRATOR_API=http://localhost:5005
```

## 🧪 Testes

```bash
# Lint
npm run lint

# Type check
npm run type-check

# Build (valida tudo)
npm run build
```

## 📖 Links Relacionados

- [Backend Identity Service](../services/Orca.Identity/README.md)
- [Backend Catalog Service](../services/Orca.Catalog/README.md)
- [Backend Requests Service](../services/Orca.Requests/README.md)
- [Backend Orchestrator Service](../services/Orca.Orchestrator/README.md)

## 🤝 Contribuindo

1. Leia o [DEVELOPMENT_GUIDE.md](./docs/DEVELOPMENT_GUIDE.md)
2. Crie uma branch: `git checkout -b feature/nova-feature`
3. Commit suas mudanças: `git commit -m 'feat: adiciona nova feature'`
4. Push: `git push origin feature/nova-feature`
5. Abra um Pull Request

## 📄 Licença

Proprietário - ORCA Platform
