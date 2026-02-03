# 🧪 Testing Guide - ORCA Web

Guia de testes para o frontend ORCA.

## 📋 Índice

1. [Setup](#setup)
2. [Unit Tests](#unit-tests)
3. [Integration Tests](#integration-tests)
4. [E2E Tests](#e2e-tests)
5. [Best Practices](#best-practices)

## 🚀 Setup

### Instalação

```bash
npm install --save-dev \
  @testing-library/react \
  @testing-library/jest-dom \
  @testing-library/user-event \
  jest \
  jest-environment-jsdom \
  @types/jest
```

### Configuração Jest

```javascript
// jest.config.js
const nextJest = require('next/jest');

const createJestConfig = nextJest({
  dir: './',
});

const customJestConfig = {
  setupFilesAfterEnv: ['<rootDir>/jest.setup.js'],
  testEnvironment: 'jest-environment-jsdom',
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1',
  },
  collectCoverageFrom: [
    'src/**/*.{js,jsx,ts,tsx}',
    '!src/**/*.d.ts',
    '!src/**/*.stories.{js,jsx,ts,tsx}',
    '!src/app/**',
  ],
};

module.exports = createJestConfig(customJestConfig);
```

```javascript
// jest.setup.js
import '@testing-library/jest-dom';
```

### Scripts

```json
// package.json
{
  "scripts": {
    "test": "jest",
    "test:watch": "jest --watch",
    "test:coverage": "jest --coverage"
  }
}
```

## 🧪 Unit Tests

### Testing Services

```typescript
// src/services/__tests__/catalog.service.test.ts
import { catalogService } from '../catalog.service';
import { ApiClient } from '@/lib/utils/api-client';

// Mock ApiClient
jest.mock('@/lib/utils/api-client');

describe('CatalogService', () => {
  let mockApiClient: jest.Mocked<ApiClient>;

  beforeEach(() => {
    mockApiClient = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
      setToken: jest.fn(),
      clearToken: jest.fn(),
    } as unknown as jest.Mocked<ApiClient>;

    // Inject mock
    (catalogService as { client: ApiClient }).client = mockApiClient;
  });

  describe('listOffers', () => {
    it('should return list of offers', async () => {
      const mockOffers = [
        { id: '1', name: 'Offer 1', active: true },
        { id: '2', name: 'Offer 2', active: false },
      ];

      mockApiClient.get.mockResolvedValue(mockOffers);

      const result = await catalogService.listOffers();

      expect(mockApiClient.get).toHaveBeenCalledWith('/api/offers');
      expect(result).toEqual(mockOffers);
    });

    it('should handle errors', async () => {
      mockApiClient.get.mockRejectedValue(new Error('Network error'));

      await expect(catalogService.listOffers()).rejects.toThrow('Network error');
    });
  });

  describe('createOffer', () => {
    it('should create offer with correct data', async () => {
      const newOffer = {
        name: 'New Offer',
        slug: 'new-offer',
        description: 'Description',
        tags: ['tag1'],
        active: true,
      };

      const mockResponse = { id: '123', ...newOffer };
      mockApiClient.post.mockResolvedValue(mockResponse);

      const result = await catalogService.createOffer(newOffer);

      expect(mockApiClient.post).toHaveBeenCalledWith('/api/offers', newOffer);
      expect(result).toEqual(mockResponse);
    });
  });
});
```

### Testing Components

```typescript
// src/components/features/offers/__tests__/offer-card.test.tsx
import { render, screen, fireEvent } from '@testing-library/react';
import { OfferCard } from '../offer-card';
import { Offer } from '@/lib/types';

// Mock Next.js router
jest.mock('next/navigation', () => ({
  useRouter: () => ({
    push: jest.fn(),
  }),
}));

describe('OfferCard', () => {
  const mockOffer: Offer = {
    id: '1',
    slug: 'test-offer',
    name: 'Test Offer',
    description: 'Test description',
    tags: ['tag1', 'tag2'],
    active: true,
    createdAtUtc: '2024-01-01T00:00:00Z',
  };

  it('should render offer details', () => {
    render(<OfferCard offer={mockOffer} />);

    expect(screen.getByText('Test Offer')).toBeInTheDocument();
    expect(screen.getByText('Test description')).toBeInTheDocument();
    expect(screen.getByText('tag1')).toBeInTheDocument();
    expect(screen.getByText('tag2')).toBeInTheDocument();
  });

  it('should show active status', () => {
    render(<OfferCard offer={mockOffer} />);

    expect(screen.getByText('Ativa')).toBeInTheDocument();
  });

  it('should show inactive status', () => {
    const inactiveOffer = { ...mockOffer, active: false };
    render(<OfferCard offer={inactiveOffer} />);

    expect(screen.getByText('Inativa')).toBeInTheDocument();
  });

  it('should call onSelect when button clicked', () => {
    const mockOnSelect = jest.fn();
    render(<OfferCard offer={mockOffer} onSelect={mockOnSelect} />);

    const selectButton = screen.getByText('Solicitar');
    fireEvent.click(selectButton);

    expect(mockOnSelect).toHaveBeenCalledWith('1');
  });

  it('should hide actions when showActions is false', () => {
    render(<OfferCard offer={mockOffer} showActions={false} />);

    expect(screen.queryByText('Ver Detalhes')).not.toBeInTheDocument();
    expect(screen.queryByText('Solicitar')).not.toBeInTheDocument();
  });
});
```

### Testing Hooks (Context)

```typescript
// src/lib/contexts/__tests__/auth.context.test.tsx
import { renderHook, act, waitFor } from '@testing-library/react';
import { useAuth, AuthProvider } from '../auth.context';
import { identityService } from '@/services';

jest.mock('@/services');

describe('AuthContext', () => {
  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <AuthProvider>{children}</AuthProvider>
  );

  beforeEach(() => {
    localStorage.clear();
    jest.clearAllMocks();
  });

  it('should initialize as not authenticated', () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
  });

  it('should login successfully', async () => {
    const mockResponse = {
      sessionToken: 'token123',
      user: {
        id: '1',
        userName: 'testuser',
        roles: [{ id: '1', name: 'Admin' }],
      },
    };

    (identityService.login as jest.Mock).mockResolvedValue(mockResponse);

    const { result } = renderHook(() => useAuth(), { wrapper });

    await act(async () => {
      await result.current.login('testuser', 'password');
    });

    await waitFor(() => {
      expect(result.current.isAuthenticated).toBe(true);
      expect(result.current.user?.userName).toBe('testuser');
      expect(result.current.sessionToken).toBe('token123');
    });
  });

  it('should logout successfully', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    // First login
    (identityService.login as jest.Mock).mockResolvedValue({
      sessionToken: 'token123',
      user: { id: '1', userName: 'testuser', roles: [] },
    });

    await act(async () => {
      await result.current.login('testuser', 'password');
    });

    // Then logout
    await act(async () => {
      result.current.logout();
    });

    expect(result.current.isAuthenticated).toBe(false);
    expect(result.current.user).toBeNull();
    expect(localStorage.getItem('orca:sessionToken')).toBeNull();
  });
});
```

## 🔗 Integration Tests

### Testing with TanStack Query

```typescript
// src/components/features/offers/__tests__/offer-list.integration.test.tsx
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { OfferList } from '../offer-list';
import { catalogService } from '@/services';

jest.mock('@/services');

describe('OfferList Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should load and display offers', async () => {
    const mockOffers = [
      { id: '1', name: 'Offer 1', active: true, tags: [] },
      { id: '2', name: 'Offer 2', active: false, tags: [] },
    ];

    (catalogService.listOffers as jest.Mock).mockResolvedValue(mockOffers);

    render(<OfferList />, { wrapper });

    // Loading state
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument(); // Ant Design Spin

    // Wait for data
    await waitFor(() => {
      expect(screen.getByText('Offer 1')).toBeInTheDocument();
      expect(screen.getByText('Offer 2')).toBeInTheDocument();
    });
  });

  it('should show error state on failure', async () => {
    (catalogService.listOffers as jest.Mock).mockRejectedValue(
      new Error('Network error')
    );

    render(<OfferList />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Erro ao carregar ofertas')).toBeInTheDocument();
      expect(screen.getByText('Network error')).toBeInTheDocument();
    });
  });

  it('should show empty state when no offers', async () => {
    (catalogService.listOffers as jest.Mock).mockResolvedValue([]);

    render(<OfferList />, { wrapper });

    await waitFor(() => {
      expect(screen.getByText('Nenhuma oferta disponível')).toBeInTheDocument();
    });
  });
});
```

### Testing Forms with Ant Design

```typescript
// src/components/features/requests/__tests__/request-form.integration.test.tsx
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RequestForm } from '../request-form';
import { requestsService } from '@/services';

jest.mock('@/services');

describe('RequestForm Integration', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    queryClient = new QueryClient();
  });

  const wrapper = ({ children }: { children: React.ReactNode }) => (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    const mockOnSuccess = jest.fn();

    (requestsService.createRequest as jest.Mock).mockResolvedValue({
      id: '123',
      description: 'Test description',
    });

    render(
      <RequestForm offerId="offer-1" onSuccess={mockOnSuccess} />,
      { wrapper }
    );

    // Fill form
    const textarea = screen.getByPlaceholderText('Descreva sua solicitação...');
    await user.type(textarea, 'Test description with more than 10 chars');

    // Submit
    const submitButton = screen.getByText('Criar Requisição');
    await user.click(submitButton);

    // Verify
    await waitFor(() => {
      expect(requestsService.createRequest).toHaveBeenCalledWith({
        offerId: 'offer-1',
        description: 'Test description with more than 10 chars',
      });
      expect(mockOnSuccess).toHaveBeenCalled();
    });
  });

  it('should show validation error for short description', async () => {
    const user = userEvent.setup();

    render(<RequestForm offerId="offer-1" />, { wrapper });

    // Fill with short text
    const textarea = screen.getByPlaceholderText('Descreva sua solicitação...');
    await user.type(textarea, 'Short');

    // Submit
    const submitButton = screen.getByText('Criar Requisição');
    await user.click(submitButton);

    // Check validation error
    await waitFor(() => {
      expect(screen.getByText('Mínimo 10 caracteres')).toBeInTheDocument();
    });
  });
});
```

## 🎭 E2E Tests

### Setup Playwright

```bash
npm install --save-dev @playwright/test
npx playwright install
```

```typescript
// playwright.config.ts
import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3000',
    screenshot: 'only-on-failure',
    video: 'retain-on-failure',
  },
  webServer: {
    command: 'npm run dev',
    port: 3000,
    reuseExistingServer: !process.env.CI,
  },
});
```

### E2E Tests

```typescript
// e2e/auth.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Authentication Flow', () => {
  test('should login successfully', async ({ page }) => {
    await page.goto('/login');

    // Fill credentials
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');

    // Submit
    await page.click('button[type="submit"]');

    // Wait for redirect
    await expect(page).toHaveURL('/dashboard');

    // Verify header
    await expect(page.locator('text=admin')).toBeVisible();
  });

  test('should show error for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    await page.fill('input[name="username"]', 'invalid');
    await page.fill('input[name="password"]', 'wrong');
    await page.click('button[type="submit"]');

    await expect(page.locator('text=Credenciais inválidas')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    // Login first
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');

    // Logout
    await page.click('button:has-text("admin")');
    await page.click('text=Sair');

    // Verify redirect to login
    await expect(page).toHaveURL('/login');
  });
});
```

```typescript
// e2e/offers.spec.ts
import { test, expect } from '@playwright/test';

test.describe('Offer Management', () => {
  test.beforeEach(async ({ page }) => {
    // Login as admin
    await page.goto('/login');
    await page.fill('input[name="username"]', 'admin');
    await page.fill('input[name="password"]', 'admin123');
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL('/dashboard');
  });

  test('should create new offer', async ({ page }) => {
    // Go to create page
    await page.click('text=Criar Nova Oferta');
    await expect(page).toHaveURL('/dashboard/admin/offers/new');

    // Fill form
    await page.fill('input[name="name"]', 'E2E Test Offer');
    await page.fill('input[name="slug"]', 'e2e-test-offer');
    await page.fill('textarea[name="description"]', 'E2E test description');
    
    // Add tags
    await page.fill('.ant-select-selection-search input', 'test-tag');
    await page.keyboard.press('Enter');

    // Submit
    await page.click('button[type="submit"]');

    // Verify success and redirect
    await expect(page.locator('text=Oferta criada com sucesso')).toBeVisible();
  });

  test('should edit existing offer', async ({ page }) => {
    // Click on offer card
    await page.click('text=E2E Test Offer');

    // Click edit button
    await page.click('text=Editar Oferta');
    await expect(page).toHaveURL(/\/dashboard\/admin\/offers\/.*\/edit/);

    // Update name
    await page.fill('input[name="name"]', 'E2E Test Offer Updated');

    // Toggle active
    await page.click('.ant-switch');

    // Submit
    await page.click('button[type="submit"]');

    // Verify success
    await expect(page.locator('text=Oferta atualizada com sucesso')).toBeVisible();
  });
});
```

## ✅ Best Practices

### 1. AAA Pattern

```typescript
test('should increment counter', () => {
  // Arrange - Setup
  const counter = new Counter(0);

  // Act - Execute
  counter.increment();

  // Assert - Verify
  expect(counter.value).toBe(1);
});
```

### 2. Test Isolation

```typescript
// ✅ BOM - Cada teste é independente
describe('MyComponent', () => {
  beforeEach(() => {
    // Reset state antes de cada teste
    jest.clearAllMocks();
    localStorage.clear();
  });

  it('test 1', () => {
    // Test doesn't depend on previous test
  });

  it('test 2', () => {
    // Independent test
  });
});

// ❌ RUIM - Testes dependentes
describe('MyComponent', () => {
  let sharedState: { count: number };

  it('test 1', () => {
    sharedState = { count: 1 };
    expect(sharedState.count).toBe(1);
  });

  it('test 2', () => {
    // ⚠️ Depende do test 1
    expect(sharedState.count).toBe(1);
  });
});
```

### 3. Descriptive Test Names

```typescript
// ✅ BOM - Nome descritivo
it('should show error message when username is empty', () => {});
it('should redirect to dashboard after successful login', () => {});
it('should disable submit button while loading', () => {});

// ❌ RUIM - Nome vago
it('should work', () => {});
it('test login', () => {});
it('button test', () => {});
```

### 4. Test User Behavior, Not Implementation

```typescript
// ✅ BOM - Testa comportamento do usuário
it('should show offer details when card is clicked', async () => {
  render(<OfferList />);
  
  const offerCard = await screen.findByText('Test Offer');
  fireEvent.click(offerCard);
  
  expect(screen.getByText('Detalhes da Oferta')).toBeInTheDocument();
});

// ❌ RUIM - Testa implementação interna
it('should call handleClick with correct offerId', () => {
  const mockHandleClick = jest.fn();
  render(<OfferCard handleClick={mockHandleClick} />);
  
  // ⚠️ Testa implementação ao invés de comportamento
  expect(mockHandleClick).toHaveBeenCalledWith('123');
});
```

### 5. Mock Only External Dependencies

```typescript
// ✅ BOM - Mock APIs externas
jest.mock('@/services', () => ({
  catalogService: {
    listOffers: jest.fn(),
  },
}));

// ✅ BOM - Não mockar componentes internos
import { OfferCard } from './offer-card';
// Use component as-is

// ❌ RUIM - Mock tudo
jest.mock('./offer-card');
jest.mock('./offer-list');
jest.mock('./use-offers-hook');
// Testes não testam nada de verdade
```

## 📊 Coverage Goals

```json
// package.json
{
  "jest": {
    "coverageThreshold": {
      "global": {
        "branches": 80,
        "functions": 80,
        "lines": 80,
        "statements": 80
      }
    }
  }
}
```

**Prioridades**:
1. Services (100% coverage) - Lógica de negócio crítica
2. Components (80% coverage) - UI principal
3. Utils (90% coverage) - Funções reutilizáveis
4. Pages (50% coverage) - Mostly composition

## 🎯 Testing Checklist

Antes de fazer commit:

- [ ] Testes unitários para services novos
- [ ] Testes de componentes com diferentes props
- [ ] Testes de error states
- [ ] Testes de loading states
- [ ] Testes de empty states
- [ ] Mock de dependencies externas
- [ ] Coverage acima do threshold
- [ ] `npm run test` passa sem erros

## 📚 Recursos

- [React Testing Library](https://testing-library.com/docs/react-testing-library/intro/)
- [Jest Documentation](https://jestjs.io/docs/getting-started)
- [Playwright Documentation](https://playwright.dev/)
- [Testing Best Practices](https://kentcdodds.com/blog/common-mistakes-with-react-testing-library)

**Happy Testing! 🧪**
