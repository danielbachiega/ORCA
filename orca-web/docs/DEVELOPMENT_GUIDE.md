# 📖 Guia de Desenvolvimento - ORCA Web

Guia completo para desenvolvedores entenderem e contribuírem com o projeto.

## 📋 Índice

1. [Setup do Ambiente](#setup-do-ambiente)
2. [Estrutura do Projeto](#estrutura-do-projeto)
3. [Conceitos Fundamentais](#conceitos-fundamentais)
4. [Como Adicionar Novas Features](#como-adicionar-novas-features)
5. [Padrões de Código](#padrões-de-código)
6. [Troubleshooting](#troubleshooting)

## 🔧 Setup do Ambiente

### Pré-requisitos

```bash
node -v   # v18+ required
npm -v    # v9+ required
```

### Instalação

```bash
# Clone e instale
git clone <repo>
cd orca-web
npm install

# Configure environment
cp .env.example .env.local

# Inicie dev server
npm run dev
```

### VSCode Extensions Recomendadas

- **ES7+ React/Redux/React-Native snippets** - Snippets rápidos
- **Tailwind CSS IntelliSense** - Autocomplete Tailwind
- **ESLint** - Linting em tempo real
- **Prettier** - Formatação automática
- **TypeScript Vue Plugin** - Melhor suporte TS

## 📁 Estrutura do Projeto

### Visão Geral

```
orca-web/
├── src/
│   ├── app/           # Páginas Next.js (Presentation)
│   ├── components/    # Componentes reutilizáveis
│   ├── services/      # Lógica de negócio (Application)
│   ├── lib/
│   │   ├── types/     # Domain models
│   │   ├── contexts/  # State management
│   │   ├── utils/     # Infrastructure
│   │   └── constants/ # Config
│   └── hooks/         # Custom hooks
├── public/            # Assets estáticos
└── docs/              # Documentação
```

### Camadas Arquiteturais

#### 1. Presentation (`/app`)

**O que é**: Páginas e UI do Next.js  
**Responsabilidade**: Renderizar, navegar, orquestrar  
**Regra de Ouro**: Não faz chamadas HTTP diretamente

```tsx
// ✅ BOM - Usa service
function DashboardPage() {
  const { data } = useQuery({
    queryKey: ['offers'],
    queryFn: () => catalogService.listOffers()
  });
  return <OfferList offers={data} />;
}

// ❌ RUIM - Axios direto na page
function DashboardPage() {
  useEffect(() => {
    axios.get('http://localhost:5001/api/offers')
      .then(setOffers);
  }, []);
}
```

#### 2. Application (`/services`)

**O que é**: Lógica de negócio e APIs  
**Responsabilidade**: Transformar dados, validar, fazer requests  
**Regra de Ouro**: Sempre usa ApiClient

```typescript
// ✅ BOM - Service encapsula lógica
class CatalogService {
  async listOffers(): Promise<Offer[]> {
    return this.client.get<Offer[]>('/api/offers');
  }
}

// ❌ RUIM - Lógica espalhada
// Não faça regras de negócio direto no component
```

#### 3. Domain (`/lib/types`)

**O que é**: Interfaces TypeScript puras  
**Responsabilidade**: Definir contratos  
**Regra de Ouro**: Zero imports externos

```typescript
// ✅ BOM - Interface pura
export interface Offer {
  id: string;
  name: string;
  active: boolean;
}

// ❌ RUIM - Não misture com implementação
export class Offer { /* ... */ }
```

#### 4. Infrastructure (`/lib/utils`)

**O que é**: Implementações técnicas  
**Responsabilidade**: HTTP, cache, storage  
**Regra de Ouro**: Substituível sem quebrar domínio

```typescript
// ✅ BOM - ApiClient genérico
class ApiClient {
  async get<T>(url: string): Promise<T> {
    // Axios, Fetch, ou qualquer outro
  }
}
```

## 🧠 Conceitos Fundamentais

### 1. TanStack Query (React Query)

**Por quê?** Gerencia cache, loading, error, refetch automático.

```tsx
// Fetch data
const { data, isLoading, error } = useQuery({
  queryKey: ['offers'],
  queryFn: () => catalogService.listOffers(),
  staleTime: 5 * 60 * 1000, // 5min
});

// Mutation (POST/PUT/DELETE)
const { mutate, isPending } = useMutation({
  mutationFn: (offer) => catalogService.createOffer(offer),
  onSuccess: () => {
    queryClient.invalidateQueries({ queryKey: ['offers'] });
  },
});
```

**Query Keys**: Identificam o cache
- `['offers']` - Lista de ofertas
- `['offers', offerId]` - Oferta específica
- `['requests', page]` - Requisições paginadas

### 2. AuthContext

**Por quê?** Estado global de autenticação simples.

```tsx
// Usar auth
const { user, roles, isAuthenticated } = useAuth();

// Login
const { login } = useAuth();
await login('admin', 'admin123');

// Logout
const { logout } = useAuth();
logout();
```

**O que armazena**:
- `user`: Dados do usuário logado
- `roles`: Array de roles do usuário
- `sessionToken`: JWT token
- `isLoading`: Estado de carregamento
- `isAuthenticated`: Boolean de autenticação

### 3. Protected Routes

**Por quê?** RBAC (Role-Based Access Control)

```tsx
// Qualquer usuário autenticado
<ProtectedRoute>
  <MyPage />
</ProtectedRoute>

// Apenas admin/superadmin
<ProtectedRoute requiredRoles={['admin', 'superadmin']}>
  <AdminPage />
</ProtectedRoute>
```

**Como funciona**:
1. Checa `isAuthenticated`
2. Se não → redirect `/login`
3. Se sim + `requiredRoles` → valida roles
4. Role não bate → exibe "Acesso Negado"

### 4. ApiClient Abstraction

**Por quê?** Preparado para migração de microserviços → Gateway/BFF

```typescript
// Hoje: Direto nos microserviços
const API_CONFIG = {
  IDENTITY: 'http://localhost:5002',
  CATALOG: 'http://localhost:5001',
};

// Amanhã: Gateway único (1 linha muda!)
const API_CONFIG = {
  IDENTITY: 'http://localhost:3000/api/identity',
  CATALOG: 'http://localhost:3000/api/catalog',
};
```

**Benefícios**:
- Centraliza interceptors (auth, errors)
- Facilita testes (mock ApiClient)
- Baixo acoplamento

## 🚀 Como Adicionar Novas Features

### Checklist Completo

1. [ ] Definir tipos no Domain (`/lib/types/index.ts`)
2. [ ] Criar/atualizar service (`/services/*.service.ts`)
3. [ ] Criar página (`/app/dashboard/*/page.tsx`)
4. [ ] Adicionar navegação (links, buttons)
5. [ ] Proteger rota se necessário (`<ProtectedRoute>`)
6. [ ] Testar build (`npm run build`)

### Exemplo: Feature "Ver Histórico de Execuções"

#### Passo 1: Domain (Types)

```typescript
// src/lib/types/index.ts
export interface Execution {
  id: string;
  requestId: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  startedAtUtc: string;
  finishedAtUtc?: string;
  logs?: string;
}
```

#### Passo 2: Service

```typescript
// src/services/orchestrator.service.ts
import { ApiClient } from '@/lib/utils/api-client';
import { API_CONFIG } from '@/lib/constants';
import { Execution } from '@/lib/types';

class OrchestratorService {
  private client: ApiClient;

  constructor() {
    this.client = new ApiClient({
      baseURL: API_CONFIG.ORCHESTRATOR,
    });
  }

  async listExecutions(requestId: string): Promise<Execution[]> {
    return this.client.get<Execution[]>(`/api/requests/${requestId}/executions`);
  }

  async getExecutionLogs(executionId: string): Promise<string> {
    return this.client.get<string>(`/api/executions/${executionId}/logs`);
  }

  setToken(token: string): void {
    this.client.setToken(token);
  }

  clearToken(): void {
    this.client.clearToken();
  }
}

export const orchestratorService = new OrchestratorService();
```

```typescript
// src/services/index.ts
export { orchestratorService } from './orchestrator.service';
```

#### Passo 3: Página

```tsx
// src/app/dashboard/requests/[id]/executions/page.tsx
'use client';

import React from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { orchestratorService } from '@/services';
import { ProtectedRoute } from '@/components/protected-route';
import { AppHeader } from '@/components/app-header';
import { Card, Table, Tag } from 'antd';

function ExecutionsContent() {
  const params = useParams();
  const requestId = params.id as string;

  const { data: executions, isLoading } = useQuery({
    queryKey: ['executions', requestId],
    queryFn: () => orchestratorService.listExecutions(requestId),
  });

  const columns = [
    {
      title: 'ID',
      dataIndex: 'id',
      key: 'id',
    },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status: string) => {
        const color = {
          success: 'green',
          failed: 'red',
          running: 'blue',
          pending: 'gray',
        }[status];
        return <Tag color={color}>{status}</Tag>;
      },
    },
    {
      title: 'Iniciado',
      dataIndex: 'startedAtUtc',
      key: 'startedAtUtc',
      render: (date: string) => new Date(date).toLocaleString('pt-BR'),
    },
  ];

  return (
    <>
      <AppHeader />
      <div style={{ padding: '24px' }}>
        <Card title="Histórico de Execuções">
          <Table
            dataSource={executions}
            columns={columns}
            loading={isLoading}
            rowKey="id"
          />
        </Card>
      </div>
    </>
  );
}

export default function ExecutionsPage() {
  return (
    <ProtectedRoute>
      <ExecutionsContent />
    </ProtectedRoute>
  );
}
```

#### Passo 4: Navegação

```tsx
// Adicione link na página de detalhes da requisição
<Button onClick={() => router.push(`/dashboard/requests/${requestId}/executions`)}>
  Ver Execuções
</Button>
```

## 📝 Padrões de Código

### Naming Conventions

```typescript
// Components: PascalCase
export const OfferCard: React.FC = () => {};

// Functions: camelCase
const handleSubmit = () => {};

// Types: PascalCase
export interface UserProfile {}

// Constants: UPPER_SNAKE_CASE
export const API_BASE_URL = 'http://localhost:5001';

// Files:
// - Components: PascalCase.tsx → OfferCard.tsx
// - Pages: kebab-case.tsx → offer-details.tsx
// - Utils: camelCase.ts → formatDate.ts
```

### Component Structure

```tsx
'use client';

// 1. Imports
import React from 'react';
import { useRouter } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Button, Card } from 'antd';
import { myService } from '@/services';

// 2. Types/Interfaces
interface MyComponentProps {
  title: string;
  onAction: () => void;
}

// 3. Component
export function MyComponent({ title, onAction }: MyComponentProps) {
  // 3.1 Hooks
  const router = useRouter();
  const { data, isLoading } = useQuery({...});

  // 3.2 Event handlers
  const handleClick = () => {
    onAction();
  };

  // 3.3 Render
  return (
    <Card title={title}>
      <Button onClick={handleClick}>Action</Button>
    </Card>
  );
}
```

### Error Handling

```tsx
// ✅ BOM - Trata erro no component
const { data, isError, error } = useQuery({
  queryKey: ['offers'],
  queryFn: () => catalogService.listOffers(),
});

if (isError) {
  return <Alert type="error" message={error.message} />;
}

// ✅ BOM - Mutation com onError
const { mutate } = useMutation({
  mutationFn: catalogService.createOffer,
  onError: (err) => {
    message.error(err instanceof Error ? err.message : 'Erro desconhecido');
  },
});
```

### Loading States

```tsx
// ✅ BOM - Skeleton enquanto carrega
if (isLoading) {
  return <Skeleton active paragraph={{ rows: 4 }} />;
}

// ✅ BOM - Spin no card
<Spin spinning={isLoading}>
  <Card>...</Card>
</Spin>

// ✅ BOM - Button com loading
<Button loading={isPending} onClick={handleSubmit}>
  Salvar
</Button>
```

## 🐛 Troubleshooting

### Problema: "roles is undefined"

**Causa**: AuthContext não está inicializado  
**Solução**: Adicione verificação

```tsx
const { roles } = useAuth();
const isAdmin = roles && roles.length > 0 && roles.some(...);
```

### Problema: CORS Error

**Causa**: Backend não tem CORS configurado  
**Solução**: Adicione no backend

```csharp
builder.Services.AddCors(options => {
    options.AddPolicy("AllowAll", policy => {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});
```

### Problema: "Cannot read property of undefined"

**Causa**: Data ainda não carregou  
**Solução**: Use optional chaining

```tsx
// ❌ RUIM
const name = offer.name;

// ✅ BOM
const name = offer?.name;

// ✅ MELHOR - Valida antes
if (!offer) return <Skeleton />;
return <div>{offer.name}</div>;
```

### Problema: Build falha com type error

**Causa**: TypeScript strict mode  
**Solução**: Nunca use `any`

```typescript
// ❌ RUIM
const data: any = response;

// ✅ BOM
const data: Offer[] = response;

// ✅ MELHOR - Unknown + type guard
const data: unknown = response;
if (Array.isArray(data)) {
  // Agora é seguro
}
```

## 📚 Recursos Adicionais

- [Next.js Docs](https://nextjs.org/docs)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Ant Design Components](https://ant.design/components/overview/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/intro.html)

## 🤝 Precisa de Ajuda?

1. Revise este documento
2. Verifique o [ARCHITECTURE.md](./ARCHITECTURE.md)
3. Procure por exemplos similares no código existente
4. Abra uma issue no repositório
