# 🏛️ Arquitetura - ORCA Web

Documentação completa da arquitetura do frontend ORCA.

## 📋 Índice

1. [Visão Geral](#visão-geral)
2. [Clean Architecture](#clean-architecture)
3. [Fluxo de Dados](#fluxo-de-dados)
4. [Padrões e Decisões](#padrões-e-decisões)
5. [Diagramas](#diagramas)

## 🎯 Visão Geral

O ORCA Web implementa **Clean Architecture** adaptada para React/Next.js, com foco em:

- **Separação de responsabilidades** - Cada camada tem papel claro
- **Baixo acoplamento** - Mudanças isoladas não quebram o sistema
- **Testabilidade** - Camadas podem ser testadas independentemente
- **Escalabilidade** - Fácil adicionar features sem refatorar

### Princípios SOLID Aplicados

- **S**ingle Responsibility - Services fazem UMA coisa
- **O**pen/Closed - Extensível via novos services, sem modificar existentes
- **L**iskov Substitution - ApiClient substituível (Axios → Fetch)
- **I**nterface Segregation - Types específicos por domínio
- **D**ependency Inversion - Pages dependem de abstrações (services), não de implementações (axios)

## 🏗️ Clean Architecture

### Camadas

```
┌─────────────────────────────────────────────────────────┐
│                  Presentation Layer                      │
│  /app - Next.js Pages, Components, UI Logic             │
└──────────────────┬──────────────────────────────────────┘
                   │ usa
                   ▼
┌─────────────────────────────────────────────────────────┐
│                 Application Layer                        │
│  /services - Business Logic, API Calls                  │
└──────────────────┬──────────────────────────────────────┘
                   │ usa
                   ▼
┌─────────────────────────────────────────────────────────┐
│                   Domain Layer                           │
│  /lib/types - Interfaces, Models (PURO)                 │
└─────────────────────────────────────────────────────────┘
                   ▲
                   │ define contratos
                   │
┌─────────────────────────────────────────────────────────┐
│              Infrastructure Layer                        │
│  /lib/utils - ApiClient, QueryClient, Storage           │
└─────────────────────────────────────────────────────────┘
```

### Camada 1: Presentation (`/app`)

**Responsabilidade**: UI, navegação, orquestração

**Contém**:
- Next.js pages (`page.tsx`)
- Layouts (`layout.tsx`)
- Client components com hooks

**Regras**:
- ✅ Renderiza UI
- ✅ Orquestra services
- ✅ Gerencia estado local (forms, modals)
- ❌ NÃO faz chamadas HTTP diretas
- ❌ NÃO tem lógica de negócio

**Exemplo**:

```tsx
// src/app/dashboard/page.tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { catalogService } from '@/services';
import { OfferCard } from '@/components';

export default function DashboardPage() {
  const { data: offers } = useQuery({
    queryKey: ['offers'],
    queryFn: () => catalogService.listOffers(),
  });

  return (
    <div>
      {offers?.map(offer => (
        <OfferCard key={offer.id} offer={offer} />
      ))}
    </div>
  );
}
```

### Camada 2: Application (`/services`)

**Responsabilidade**: Lógica de negócio, transformação de dados

**Contém**:
- Services (identity, catalog, requests)
- Validações
- Transformações de dados

**Regras**:
- ✅ Usa ApiClient (abstração)
- ✅ Retorna tipos do Domain
- ✅ Trata erros específicos
- ❌ NÃO importa componentes React
- ❌ NÃO tem dependência de framework UI

**Exemplo**:

```typescript
// src/services/catalog.service.ts
import { ApiClient } from '@/lib/utils/api-client';
import { API_CONFIG } from '@/lib/constants';
import { Offer } from '@/lib/types';

class CatalogService {
  private client: ApiClient;

  constructor() {
    this.client = new ApiClient({
      baseURL: API_CONFIG.CATALOG,
    });
  }

  async listOffers(): Promise<Offer[]> {
    const offers = await this.client.get<Offer[]>('/api/offers');
    
    // Exemplo: transformação ou filtro
    return offers.filter(o => o.active);
  }

  async createOffer(offer: Omit<Offer, 'id'>): Promise<Offer> {
    return this.client.post<Offer>('/api/offers', offer);
  }

  setToken(token: string): void {
    this.client.setToken(token);
  }
}

export const catalogService = new CatalogService();
```

### Camada 3: Domain (`/lib/types`)

**Responsabilidade**: Definir modelos e contratos

**Contém**:
- Interfaces TypeScript
- Enums
- Types auxiliares

**Regras**:
- ✅ Interfaces puras
- ✅ Zero lógica
- ✅ Zero imports externos
- ❌ NÃO tem classes
- ❌ NÃO tem implementações

**Exemplo**:

```typescript
// src/lib/types/index.ts
export interface Offer {
  id: string;
  name: string;
  description?: string;
  tags: string[];
  active: boolean;
  createdAtUtc: string;
  updatedAtUtc?: string;
  visibleToRoles?: string[];
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  accessType: number;
}

export enum RequestStatus {
  Draft = 'draft',
  Pending = 'pending',
  Approved = 'approved',
  Rejected = 'rejected',
  Executing = 'executing',
  Completed = 'completed',
  Failed = 'failed',
}
```

### Camada 4: Infrastructure (`/lib/utils`)

**Responsabilidade**: Implementações técnicas

**Contém**:
- ApiClient (Axios wrapper)
- QueryClient (TanStack Query config)
- LocalStorage helpers
- Error handlers

**Regras**:
- ✅ Genérico e reutilizável
- ✅ Substituível (Axios → Fetch)
- ✅ Configurável
- ❌ NÃO tem lógica de negócio

**Exemplo**:

```typescript
// src/lib/utils/api-client.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor(config: AxiosRequestConfig) {
    this.client = axios.create(config);
    
    // Interceptor de request - injeta token
    this.client.interceptors.request.use((config) => {
      if (this.token) {
        config.headers.Authorization = `Bearer ${this.token}`;
      }
      return config;
    });

    // Interceptor de response - trata erros
    this.client.interceptors.response.use(
      (response) => response.data,
      (error) => {
        if (error.response?.status === 401) {
          window.dispatchEvent(new Event('auth:unauthorized'));
        }
        throw error;
      }
    );
  }

  async get<T>(url: string): Promise<T> {
    return this.client.get(url);
  }

  async post<T>(url: string, data: unknown): Promise<T> {
    return this.client.post(url, data);
  }

  setToken(token: string): void {
    this.token = token;
  }

  clearToken(): void {
    this.token = null;
  }
}
```

## 🔄 Fluxo de Dados

### Leitura (GET)

```
┌──────────┐      1. useQuery       ┌───────────┐
│   Page   │ ───────────────────> │  Service  │
│Component │                        │           │
└──────────┘                        └─────┬─────┘
     ▲                                    │
     │                                    │ 2. client.get()
     │ 5. Renderiza                       │
     │    com data                        ▼
     │                              ┌───────────┐
     │                              │ ApiClient │
     │                              │           │
     │                              └─────┬─────┘
     │                                    │
     │                                    │ 3. HTTP GET
     │                                    │
     │                                    ▼
     │                              ┌───────────┐
     │                              │  Backend  │
     │                              │    API    │
     │                              └─────┬─────┘
     │                                    │
     │ 4. Cache &                         │
     │    return data                     │
     └────────────────────────────────────┘
```

### Escrita (POST/PUT/DELETE)

```
┌──────────┐    1. User action    ┌───────────┐
│   Page   │ ───────────────────> │ useMutation│
│Component │                       │            │
└──────────┘                       └─────┬──────┘
     ▲                                   │
     │                                   │ 2. mutate()
     │ 6. onSuccess                      │
     │    - invalidate cache             ▼
     │    - show message           ┌───────────┐
     │                             │  Service  │
     │                             │           │
     │                             └─────┬─────┘
     │                                   │
     │                                   │ 3. client.post()
     │                                   │
     │                                   ▼
     │                             ┌───────────┐
     │                             │ ApiClient │
     │                             │           │
     │                             └─────┬─────┘
     │                                   │
     │                                   │ 4. HTTP POST
     │                                   │
     │                                   ▼
     │                             ┌───────────┐
     │                             │  Backend  │
     │ 5. Return result            │    API    │
     └─────────────────────────────┴───────────┘
```

## 🎨 Padrões e Decisões

### 1. Por quê TanStack Query?

**Problema**: Gerenciar estado de servidor (loading, cache, refetch) é complexo

**Solução**: TanStack Query automatiza

```tsx
// Sem React Query - código verboso
const [data, setData] = useState(null);
const [loading, setLoading] = useState(true);
const [error, setError] = useState(null);

useEffect(() => {
  fetch('/api/offers')
    .then(res => res.json())
    .then(setData)
    .catch(setError)
    .finally(() => setLoading(false));
}, []);

// Com React Query - simples
const { data, isLoading, error } = useQuery({
  queryKey: ['offers'],
  queryFn: () => catalogService.listOffers(),
});
```

**Benefícios**:
- Cache automático (stale-while-revalidate)
- Refetch em background
- Deduplicação de requests
- Garbage collection

### 2. Por quê Context API (não Redux)?

**Problema**: Estado de autenticação é simples

**Solução**: Context API suficiente

```tsx
// Auth Context - 1 estado global
const AuthContext = createContext({
  user: null,
  login: () => {},
  logout: () => {},
});

// Redux seria overkill:
// - Boilerplate desnecessário
// - Actions, reducers, store para 1 estado
```

**Quando usar Redux?**
- Múltiplos estados globais complexos
- Time travel debugging necessário
- Integração com DevTools essencial

### 3. Por quê ApiClient Abstraction?

**Problema**: Migração de arquitetura (microserviços → Gateway)

**Solução**: Abstrair HTTP client

```typescript
// Hoje: localhost:5001, 5002, 5003...
const API_CONFIG = {
  CATALOG: 'http://localhost:5001',
  IDENTITY: 'http://localhost:5002',
};

// Amanhã: Gateway único
const API_CONFIG = {
  CATALOG: 'http://localhost:3000/api/catalog',
  IDENTITY: 'http://localhost:3000/api/identity',
};

// Mudança: 1 arquivo, não 50 componentes!
```

### 4. Por quê TypeScript Strict?

**Problema**: Erros em runtime custam caro

**Solução**: Type safety em dev time

```typescript
// ❌ JavaScript - erro em runtime
function getUserName(user) {
  return user.name.toUpperCase(); // se user null? 💥
}

// ✅ TypeScript - erro em dev time
function getUserName(user: User | null): string {
  return user?.name?.toUpperCase() ?? 'Unknown'; // seguro ✅
}
```

## 📊 Diagramas

### Arquitetura Completa

```
┌────────────────────────────────────────────────────────────────┐
│                         Browser                                 │
│  ┌──────────────────────────────────────────────────────────┐ │
│  │                  Next.js App (Port 3000)                  │ │
│  │                                                            │ │
│  │  ┌─────────┐      ┌─────────┐      ┌──────────┐         │ │
│  │  │  Pages  │─────>│ Services│─────>│ApiClient │         │ │
│  │  │  (UI)   │<─────│(Business)│<─────│  (HTTP)  │         │ │
│  │  └─────────┘      └─────────┘      └────┬─────┘         │ │
│  │       │                                  │                │ │
│  │       ▼                                  │                │ │
│  │  ┌─────────┐                            │                │ │
│  │  │ Context │                            │                │ │
│  │  │  (Auth) │                            │                │ │
│  │  └─────────┘                            │                │ │
│  └────────────────────────────────────────┼────────────────┘ │
└─────────────────────────────────────────────┼──────────────────┘
                                              │ HTTP
                                              ▼
┌────────────────────────────────────────────────────────────────┐
│                      Backend Services                           │
│  ┌────────────┐  ┌────────────┐  ┌────────────┐               │
│  │ Identity   │  │  Catalog   │  │  Requests  │               │
│  │  :5002     │  │   :5001    │  │   :5004    │               │
│  └────────────┘  └────────────┘  └────────────┘               │
└────────────────────────────────────────────────────────────────┘
```

### Fluxo de Autenticação

```
┌─────────┐                                    ┌──────────┐
│  User   │                                    │  LDAP    │
└────┬────┘                                    └─────▲────┘
     │                                               │
     │ 1. Login (username, password)                 │
     ▼                                               │
┌─────────┐      2. POST /api/auth/login       ┌────┴─────┐
│ Browser │─────────────────────────────────>│ Identity │
│         │                                    │   API    │
│         │                                    └────┬─────┘
│         │                                         │
│         │                                         │ 3. Validate
│         │                                         │
│         │                                    ┌────▼─────┐
│         │                                    │  Users   │
│         │                                    │   DB     │
│         │<───────────────────────────────   └──────────┘
│         │  4. { sessionToken, user, roles }
│         │
│         │ 5. Save localStorage + Context
│         │
│         │ 6. All requests → Authorization: Bearer {token}
└─────────┘
```

## 🔒 Segurança

### RBAC (Role-Based Access Control)

```typescript
// Níveis de acesso
Consumer   // Ver ofertas, criar requisições
Editor     // + Criar/editar ofertas
Admin      // + Controlar roles e visibilidade
Superadmin // + Configurações globais

// Implementação
<ProtectedRoute requiredRoles={['admin', 'superadmin']}>
  <AdminPage />
</ProtectedRoute>
```

### Token Management

1. **Login**: Backend retorna JWT
2. **Storage**: localStorage (key: `orca:sessionToken`)
3. **Injection**: ApiClient interceptor adiciona `Authorization` header
4. **Expiration**: Backend valida + frontend escuta evento `auth:unauthorized`
5. **Logout**: Limpa localStorage + Context

## 🚀 Performance

### Code Splitting

Next.js 14 faz automaticamente:
- Pages são chunks separados
- Dynamic imports: `const Component = dynamic(() => import('./Component'))`

### Caching Strategy

```typescript
// TanStack Query config
staleTime: 5 * 60 * 1000,  // 5min - considera "fresh"
gcTime: 10 * 60 * 1000,     // 10min - mantém em cache

// Invalidação manual
queryClient.invalidateQueries({ queryKey: ['offers'] });
```

### Image Optimization

```tsx
// Next.js Image - lazy load + optimization
import Image from 'next/image';

<Image
  src="/logo.png"
  alt="ORCA"
  width={200}
  height={50}
  loading="lazy"
/>
```

## 📚 Referências

- [Clean Architecture - Uncle Bob](https://blog.cleancoder.com/uncle-bob/2012/08/13/the-clean-architecture.html)
- [Next.js App Router](https://nextjs.org/docs/app)
- [TanStack Query](https://tanstack.com/query/latest)
- [SOLID Principles](https://en.wikipedia.org/wiki/SOLID)
