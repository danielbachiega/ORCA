# 📝 Changelog - ORCA Web

Histórico de mudanças e features implementadas no frontend ORCA.

O formato é baseado em [Keep a Changelog](https://keepachangelog.com/pt-BR/1.0.0/).

## [Unreleased]

### 🚧 Em Desenvolvimento
- Designer de formulários visual (JSON Schema builder)
- Renderização dinâmica de formulários com Uniforms
- Integração com AWX/Operations Orchestration
- Histórico de execuções de requisições
- Dashboard analytics para admins

## [0.2.0] - 2024-01-15

### ✨ Added

#### Admin Features
- Página de criação de ofertas (`/dashboard/admin/offers/new`)
- Página de edição de ofertas (`/dashboard/admin/offers/[id]/edit`)
- Controle de visibilidade de ofertas por roles (campo `visibleToRoles`)
- Botão "Criar Nova Oferta" no dashboard para admins
- Botão "Editar Oferta" na página de detalhes para admins
- API endpoint para listar roles disponíveis

#### RBAC (Role-Based Access Control)
- ProtectedRoute component com suporte a `requiredRoles`
- Verificação de roles case-insensitive
- Badges de roles no menu do usuário

#### UX Improvements
- Tags input com tokenSeparators (vírgula e espaço criam tags)
- Select múltiplo para seleção de roles com loading state
- Toggle de status ativo/inativo em ofertas
- Breadcrumbs em páginas administrativas

### 🔧 Fixed
- Corrigido erro "Cannot update component while rendering" em ProtectedRoute
- Corrigido LDAP mock para superadmin retornar grupos corretos
- Corrigido mapeamento de roles no AuthContext (roles agora vêm dentro de user)
- Sincronização de tipos entre frontend e backend (Offer interface)
- Corrigido campo `active` (antes era `isPublished`)
- Corrigido UpdateOffer endpoint (backend exige `id` no body)

### 🎨 Changed
- Removido menu admin do dropdown do usuário (admin actions agora no dashboard)
- Ant Design: migrado props deprecated (`message` → `title`, `direction` → `orientation`)
- AuthContext agora extrai roles de `user.roles` ao invés de top-level

### 📚 Documentation
- Criado README.md completo com visão geral do projeto
- Criado ARCHITECTURE.md com explicação de Clean Architecture
- Criado DEVELOPMENT_GUIDE.md com guia step-by-step de desenvolvimento
- Criado API_ABSTRACTION.md explicando ApiClient pattern
- Criado COMPONENTS.md com padrões e best practices
- Criado TROUBLESHOOTING.md com soluções de problemas comuns
- Criado TESTING.md com guia de testes unitários, integração e E2E

## [0.1.0] - 2024-01-10

### ✨ Added

#### Core Features
- Projeto bootstrap com Next.js 14 + App Router
- TypeScript em modo strict
- Ant Design 5.x como biblioteca de componentes
- TanStack Query v5 para server state management
- Tailwind CSS para estilização
- Docker setup completo com docker-compose

#### Authentication System
- AuthContext com React Context API
- Login page com username/password
- Integração com LDAP mock (Identity API)
- JWT session token com persistência em localStorage
- Protected routes (ProtectedRoute component)
- Auto-logout em 401 com evento global `auth:unauthorized`

#### Dashboard & Offers
- Dashboard page com grid de ofertas ativas
- Offer details page com tags, descrição e status
- Filtros de ofertas por status
- Cards responsivos (Grid 3 colunas desktop, 1 coluna mobile)

#### Requests
- Request creation form com descrição
- My Requests page com listagem paginada
- Filtros por status (Pending, Approved, Rejected, Cancelled, InProgress, Completed)
- Status badges com cores (Pending=blue, InProgress=cyan, Completed=green, Rejected=red)
- Paginação com 10 itens por página

#### API Abstraction Layer
- ApiClient genérico com Axios
- Request interceptor para injeção automática de Authorization header
- Response interceptor para unwrap data e error handling
- Services específicos por domínio:
  - `identityService` (login, me, logout, listRoles)
  - `catalogService` (listOffers, getOfferById, createOffer, updateOffer, deleteOffer)
  - `requestsService` (listRequests, createRequest, getRequestById)
  - `orchestratorService` (placeholder para futuro)

#### UI Components
- AppHeader com menu dropdown do usuário
- ProtectedRoute wrapper para RBAC
- Loading states com Ant Design Spin
- Empty states com Ant Design Empty
- Error alerts com Ant Design Alert

### 🔧 Fixed
- CORS configurado em todos os microservices backend
- Error handling em queries e mutations
- Token sync across all services após login

### 🎨 Changed
- Clean Architecture implementada:
  - **Domain**: `/lib/types` (interfaces TypeScript)
  - **Application**: `/services` (business logic)
  - **Infrastructure**: `/lib/utils` (ApiClient, helpers)
  - **Presentation**: `/app` (páginas e UI)

### 🔐 Security
- JWT token storage em localStorage
- Authorization header em todas requests autenticadas
- Auto-redirect para /login se não autenticado
- Roles-based access control (Consumer, Editor, Admin, Superadmin)

## Tipos de Mudanças

- `✨ Added` - Novas features
- `🔧 Fixed` - Bug fixes
- `🎨 Changed` - Mudanças em features existentes
- `🗑️ Deprecated` - Features que serão removidas
- `❌ Removed` - Features removidas
- `🔐 Security` - Vulnerabilidades corrigidas
- `📚 Documentation` - Apenas documentação

## Convenções de Commit

Este projeto usa [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` - Nova feature (✨ Added)
- `fix:` - Bug fix (🔧 Fixed)
- `docs:` - Documentação (📚 Documentation)
- `style:` - Formatação, sem mudança de código
- `refactor:` - Refatoração sem mudança de comportamento
- `test:` - Adicionar/corrigir testes
- `chore:` - Tarefas de manutenção

### Exemplos:

```bash
git commit -m "feat: adiciona página de criação de ofertas"
git commit -m "fix: corrige erro de autenticação ao fazer logout"
git commit -m "docs: adiciona DEVELOPMENT_GUIDE.md"
git commit -m "refactor: extrai lógica de validação para service"
```

## Roadmap

### v0.3.0 (Q1 2024)
- [ ] Form Designer com JSON Schema builder
- [ ] Drag-and-drop form builder interface
- [ ] Uniforms integration para renderização dinâmica
- [ ] Preview de formulários em tempo real

### v0.4.0 (Q1 2024)
- [ ] Integração com AWX/Operations Orchestration
- [ ] Mapeamento de campos de formulário → job templates
- [ ] Webhook handling para status updates
- [ ] Request execution history page

### v0.5.0 (Q2 2024)
- [ ] Admin dashboard com analytics
- [ ] Gráficos de requisições por status
- [ ] Gráficos de ofertas mais solicitadas
- [ ] Export de relatórios (CSV, PDF)

### v1.0.0 (Q2 2024)
- [ ] Gateway/BFF implementation
- [ ] Production-ready error handling
- [ ] Comprehensive test coverage (>80%)
- [ ] Performance optimization
- [ ] Accessibility (WCAG 2.1 AA)
- [ ] Internationalization (i18n)

---

**Última atualização**: 2024-01-15
