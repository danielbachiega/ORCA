# 🔌 API Abstraction - ORCA Web

Guia completo sobre a camada de abstração de APIs.

## 📋 Índice

1. [Por quê Abstrair?](#por-quê-abstrair)
2. [ApiClient](#apiclient)
3. [Services](#services)
4. [Migração para Gateway](#migração-para-gateway)
5. [Exemplos Práticos](#exemplos-práticos)

## 🎯 Por quê Abstrair?

### Problema

```tsx
// ❌ RUIM - Axios espalhado por todo código
function DashboardPage() {
  useEffect(() => {
    axios.get('http://localhost:5001/api/offers', {
      headers: { Authorization: `Bearer ${token}` }
    }).then(setOffers);
  }, []);
}

function OfferDetailsPage() {
  useEffect(() => {
    axios.get(`http://localhost:5001/api/offers/${id}`, {
      headers: { Authorization: `Bearer ${token}` }
    }).then(setOffer);
  }, []);
}

// 🚨 Problemas:
// 1. URL hardcoded em 50 lugares
// 2. Auth header repetido 50 vezes
// 3. Error handling inconsistente
// 4. Migração para Gateway = refatorar 50 arquivos
```

### Solução: Abstrair em Camadas

```
Pages → Services → ApiClient → Backend
```

**Benefícios**:
- ✅ URLs configuráveis (1 arquivo)
- ✅ Auth automático (interceptor)
- ✅ Error handling centralizado
- ✅ Migração fácil (Gateway = trocar baseURL)
- ✅ Testável (mock ApiClient)

## 🛠️ ApiClient

### Conceito

**ApiClient** é uma classe genérica que encapsula o HTTP client (Axios).

### Implementação

```typescript
// src/lib/utils/api-client.ts
import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';

export interface ApiClientConfig {
  baseURL: string;
  timeout?: number;
}

export class ApiClient {
  private client: AxiosInstance;
  private token: string | null = null;

  constructor(config: ApiClientConfig) {
    this.client = axios.create({
      baseURL: config.baseURL,
      timeout: config.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
      },
    });

    this.setupInterceptors();
  }

  private setupInterceptors(): void {
    // Request interceptor - injeta token
    this.client.interceptors.request.use(
      (config) => {
        if (this.token) {
          config.headers.Authorization = `Bearer ${this.token}`;
        }
        return config;
      },
      (error) => Promise.reject(error)
    );

    // Response interceptor - unwrap data + error handling
    this.client.interceptors.response.use(
      (response) => response.data, // Retorna só o data
      (error) => {
        if (error.response?.status === 401) {
          // Emit evento global de desautenticação
          window.dispatchEvent(new Event('auth:unauthorized'));
        }
        return Promise.reject(this.handleError(error));
      }
    );
  }

  private handleError(error: unknown): Error {
    if (axios.isAxiosError(error)) {
      const message = error.response?.data?.message || error.message;
      const httpError = new Error(message) as unknown as Record<string, unknown>;
      httpError.status = error.response?.status;
      httpError.data = error.response?.data;
      return httpError as unknown as Error;
    }
    return error as Error;
  }

  // ========== Métodos HTTP ==========

  async get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.get(url, config);
  }

  async post<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.client.post(url, data, config);
  }

  async put<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.client.put(url, data, config);
  }

  async patch<T>(url: string, data?: unknown, config?: AxiosRequestConfig): Promise<T> {
    return this.client.patch(url, data, config);
  }

  async delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return this.client.delete(url, config);
  }

  // ========== Token Management ==========

  setToken(token: string): void {
    this.token = token;
  }

  clearToken(): void {
    this.token = null;
  }

  getToken(): string | null {
    return this.token;
  }
}
```

### Features do ApiClient

#### 1. Request Interceptor - Auth Automático

```typescript
// Toda request automaticamente tem Authorization header
this.client.interceptors.request.use((config) => {
  if (this.token) {
    config.headers.Authorization = `Bearer ${this.token}`;
  }
  return config;
});

// Uso:
apiClient.setToken(sessionToken);
await apiClient.get('/api/offers'); // ✅ Header automático
```

#### 2. Response Interceptor - Unwrap Data

```typescript
// Backend retorna: { data: [...], status: 200 }
// ApiClient retorna: [...]

this.client.interceptors.response.use(
  (response) => response.data, // Só retorna o data
);

// Benefício:
const offers = await apiClient.get('/api/offers');
// Já é array direto, não precisa .data
```

#### 3. Error Handling Centralizado

```typescript
// 401 → Emit evento global
if (error.response?.status === 401) {
  window.dispatchEvent(new Event('auth:unauthorized'));
}

// AuthContext escuta:
window.addEventListener('auth:unauthorized', () => {
  logout(); // Limpa sessão
  router.push('/login'); // Redireciona
});
```

## 🔧 Services

### Conceito

**Services** usam ApiClient para encapsular lógica de negócio específica de cada domínio.

### Estrutura Padrão

```typescript
// src/services/[domain].service.ts
import { ApiClient } from '@/lib/utils/api-client';
import { API_CONFIG } from '@/lib/constants';
import { DomainType } from '@/lib/types';

class DomainService {
  private client: ApiClient;

  constructor() {
    this.client = new ApiClient({
      baseURL: API_CONFIG.DOMAIN_API,
    });
  }

  // Métodos de negócio
  async list(): Promise<DomainType[]> {
    return this.client.get<DomainType[]>('/api/resource');
  }

  async getById(id: string): Promise<DomainType> {
    return this.client.get<DomainType>(`/api/resource/${id}`);
  }

  async create(data: Partial<DomainType>): Promise<DomainType> {
    return this.client.post<DomainType>('/api/resource', data);
  }

  async update(id: string, data: Partial<DomainType>): Promise<DomainType> {
    return this.client.put<DomainType>(`/api/resource/${id}`, data);
  }

  async delete(id: string): Promise<void> {
    return this.client.delete(`/api/resource/${id}`);
  }

  // Token management
  setToken(token: string): void {
    this.client.setToken(token);
  }

  clearToken(): void {
    this.client.clearToken();
  }
}

// Export singleton
export const domainService = new DomainService();
```

### Exemplo Real: IdentityService

```typescript
// src/services/identity.service.ts
import { ApiClient } from '@/lib/utils/api-client';
import { API_CONFIG } from '@/lib/constants';
import { LoginResponse, User, Role } from '@/lib/types';

class IdentityService {
  private client: ApiClient;

  constructor() {
    this.client = new ApiClient({
      baseURL: API_CONFIG.IDENTITY,
    });
  }

  async login(username: string, password: string): Promise<LoginResponse> {
    return this.client.post<LoginResponse>('/api/auth/login', {
      username,
      password,
    });
  }

  async getMe(): Promise<User> {
    return this.client.get<User>('/api/auth/me');
  }

  async logout(): Promise<void> {
    return this.client.post('/api/auth/logout');
  }

  async listRoles(): Promise<Role[]> {
    return this.client.get<Role[]>('/api/roles');
  }

  setToken(token: string): void {
    this.client.setToken(token);
  }

  clearToken(): void {
    this.client.clearToken();
  }
}

export const identityService = new IdentityService();
```

### Exemplo Real: CatalogService

```typescript
// src/services/catalog.service.ts
import { ApiClient } from '@/lib/utils/api-client';
import { API_CONFIG } from '@/lib/constants';
import { Offer, OfferDetails } from '@/lib/types';

class CatalogService {
  private client: ApiClient;

  constructor() {
    this.client = new ApiClient({
      baseURL: API_CONFIG.CATALOG,
    });
  }

  async listOffers(): Promise<Offer[]> {
    return this.client.get<Offer[]>('/api/offers');
  }

  async getOfferById(offerId: string): Promise<OfferDetails> {
    return this.client.get<OfferDetails>(`/api/offers/${offerId}`);
  }

  async createOffer(offer: Omit<Offer, 'id' | 'createdAtUtc' | 'updatedAtUtc'>): Promise<Offer> {
    return this.client.post<Offer>('/api/offers', offer);
  }

  async updateOffer(offerId: string, offer: Partial<Offer>): Promise<Offer> {
    return this.client.put<Offer>(`/api/offers/${offerId}`, offer);
  }

  async deleteOffer(offerId: string): Promise<void> {
    return this.client.delete(`/api/offers/${offerId}`);
  }

  setToken(token: string): void {
    this.client.setToken(token);
  }

  clearToken(): void {
    this.client.clearToken();
  }
}

export const catalogService = new CatalogService();
```

### Barrel Exports

```typescript
// src/services/index.ts
export { identityService } from './identity.service';
export { catalogService } from './catalog.service';
export { requestsService } from './requests.service';
export { orchestratorService } from './orchestrator.service';
```

## 🔄 Migração para Gateway

### Hoje: Microserviços Diretos

```typescript
// src/lib/constants/index.ts
export const API_CONFIG = {
  IDENTITY: 'http://localhost:5002',
  CATALOG: 'http://localhost:5001',
  REQUESTS: 'http://localhost:5004',
  ORCHESTRATOR: 'http://localhost:5005',
};
```

**Arquitetura**:
```
Browser
  ├─> Identity API (5002)
  ├─> Catalog API (5001)
  ├─> Requests API (5004)
  └─> Orchestrator API (5005)
```

### Amanhã: Gateway/BFF

```typescript
// src/lib/constants/index.ts
export const API_CONFIG = {
  IDENTITY: 'http://localhost:3000/api/identity',
  CATALOG: 'http://localhost:3000/api/catalog',
  REQUESTS: 'http://localhost:3000/api/requests',
  ORCHESTRATOR: 'http://localhost:3000/api/orchestrator',
};
```

**Arquitetura**:
```
Browser
  └─> Gateway (3000)
       ├─> Identity API (internal)
       ├─> Catalog API (internal)
       ├─> Requests API (internal)
       └─> Orchestrator API (internal)
```

**Mudança**: 1 arquivo, zero refactoring de pages/components! 🎉

## 📝 Exemplos Práticos

### Uso em Component (TanStack Query)

```tsx
'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { catalogService } from '@/services';
import { Button } from 'antd';

export function OfferList() {
  const queryClient = useQueryClient();

  // GET - Lista
  const { data: offers, isLoading } = useQuery({
    queryKey: ['offers'],
    queryFn: () => catalogService.listOffers(),
  });

  // POST - Criar
  const { mutate: createOffer, isPending } = useMutation({
    mutationFn: (offer) => catalogService.createOffer(offer),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['offers'] });
    },
  });

  if (isLoading) return <div>Carregando...</div>;

  return (
    <div>
      {offers?.map(offer => (
        <div key={offer.id}>{offer.name}</div>
      ))}
      <Button onClick={() => createOffer({ name: 'Nova Oferta' })}>
        Criar
      </Button>
    </div>
  );
}
```

### Token Sync Across Services

```typescript
// src/lib/contexts/auth.context.tsx
const login = async (username: string, password: string) => {
  const response = await identityService.login(username, password);

  setSessionToken(response.sessionToken);

  // Sincroniza token em TODOS os services
  identityService.setToken(response.sessionToken);
  catalogService.setToken(response.sessionToken);
  requestsService.setToken(response.sessionToken);
  orchestratorService.setToken(response.sessionToken);
};

const logout = () => {
  // Limpa token de TODOS os services
  identityService.clearToken();
  catalogService.clearToken();
  requestsService.clearToken();
  orchestratorService.clearToken();
};
```

### Error Handling

```tsx
const { data, error, isError } = useQuery({
  queryKey: ['offers'],
  queryFn: () => catalogService.listOffers(),
});

if (isError) {
  return (
    <Alert
      type="error"
      message="Erro ao carregar ofertas"
      description={error instanceof Error ? error.message : 'Erro desconhecido'}
    />
  );
}
```

## 🧪 Testabilidade

### Mock ApiClient

```typescript
// tests/mocks/api-client.mock.ts
export class MockApiClient {
  async get<T>(url: string): Promise<T> {
    return mockData[url] as T;
  }

  async post<T>(url: string, data: unknown): Promise<T> {
    return { id: '123', ...data } as T;
  }

  setToken() {}
  clearToken() {}
}

// tests/services/catalog.service.test.ts
import { CatalogService } from '@/services/catalog.service';
import { MockApiClient } from '../mocks/api-client.mock';

test('listOffers returns offers', async () => {
  const service = new CatalogService();
  service.client = new MockApiClient(); // Inject mock

  const offers = await service.listOffers();
  expect(offers).toHaveLength(3);
});
```

## 🎯 Checklist: Novo Service

Ao criar um novo service:

- [ ] Criar classe com constructor que instancia ApiClient
- [ ] Passar `baseURL` do `API_CONFIG`
- [ ] Métodos async que retornam tipos do Domain
- [ ] Implementar `setToken()` e `clearToken()`
- [ ] Export singleton `export const myService = new MyService()`
- [ ] Adicionar em `src/services/index.ts` (barrel export)
- [ ] Sincronizar token no AuthContext `login/logout`

## 📚 Resumo

| Conceito | Responsabilidade | Benefício |
|----------|------------------|-----------|
| **ApiClient** | HTTP abstrato | Interceptors, error handling |
| **Services** | Lógica de negócio | Encapsulamento, testabilidade |
| **API_CONFIG** | URLs centralizadas | Migração fácil (Gateway) |
| **Interceptors** | Auth automático | Zero boilerplate |
| **Barrel Exports** | Import único | `import { catalogService } from '@/services'` |

**Resultado**: Arquitetura desacoplada, fácil de migrar, testar e manter. 🚀
