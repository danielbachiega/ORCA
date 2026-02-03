# 🧩 Components Guide - ORCA Web

Guia completo dos componentes e padrões de organização.

## 📋 Índice

1. [Estrutura de Componentes](#estrutura-de-componentes)
2. [Component Patterns](#component-patterns)
3. [Ant Design Usage](#ant-design-usage)
4. [Componentes Principais](#componentes-principais)
5. [Best Practices](#best-practices)

## 📁 Estrutura de Componentes

```
src/components/
├── app-header.tsx           # Header global com menu do usuário
├── protected-route.tsx      # Wrapper RBAC para rotas protegidas
├── features/                # Componentes de funcionalidades específicas
│   ├── auth/
│   │   └── login-form.tsx
│   ├── offers/
│   │   ├── offer-card.tsx
│   │   ├── offer-form.tsx
│   │   └── offer-list.tsx
│   └── requests/
│       ├── request-form.tsx
│       ├── request-table.tsx
│       └── request-filters.tsx
├── layouts/                 # Componentes de layout
│   ├── main-layout.tsx
│   ├── dashboard-layout.tsx
│   └── admin-layout.tsx
└── ui/                      # Componentes UI reutilizáveis
    ├── loading-spinner.tsx
    ├── empty-state.tsx
    ├── error-alert.tsx
    └── page-header.tsx
```

### Organização por Tipo

#### 1. Root Components (`/components`)

Componentes globais usados em toda aplicação:
- `app-header.tsx` - Header com navegação e menu de usuário
- `protected-route.tsx` - HOC para proteção de rotas com RBAC

#### 2. Feature Components (`/components/features`)

Componentes específicos de domínio agrupados por feature:
- `auth/` - Login, registro, recuperação de senha
- `offers/` - Cards, listagens, formulários de ofertas
- `requests/` - Tabelas, formulários, detalhes de requisições

#### 3. Layout Components (`/components/layouts`)

Wrappers de página que definem estrutura comum:
- `main-layout.tsx` - Layout básico com header/footer
- `dashboard-layout.tsx` - Layout do dashboard com sidebar
- `admin-layout.tsx` - Layout administrativo

#### 4. UI Components (`/components/ui`)

Componentes genéricos reutilizáveis sem lógica de negócio:
- `loading-spinner.tsx` - Indicadores de carregamento
- `empty-state.tsx` - Estados vazios customizados
- `error-alert.tsx` - Alertas de erro padronizados

## 🎨 Component Patterns

### Pattern 1: Feature Component

```tsx
// src/components/features/offers/offer-card.tsx
'use client';

import { Card, Tag, Button, Space } from 'antd';
import { useRouter } from 'next/navigation';
import { Offer } from '@/lib/types';

// ========== Props Interface ==========
interface OfferCardProps {
  offer: Offer;
  showActions?: boolean;
  onSelect?: (offerId: string) => void;
}

// ========== Component ==========
export function OfferCard({ offer, showActions = true, onSelect }: OfferCardProps) {
  const router = useRouter();

  // ========== Handlers ==========
  const handleView = () => {
    router.push(`/dashboard/offers/${offer.id}`);
  };

  const handleSelect = () => {
    onSelect?.(offer.id);
  };

  // ========== Render ==========
  return (
    <Card
      title={offer.name}
      extra={
        <Tag color={offer.active ? 'green' : 'red'}>
          {offer.active ? 'Ativa' : 'Inativa'}
        </Tag>
      }
      actions={
        showActions
          ? [
              <Button key="view" type="link" onClick={handleView}>
                Ver Detalhes
              </Button>,
              <Button key="select" type="primary" onClick={handleSelect}>
                Solicitar
              </Button>,
            ]
          : undefined
      }
    >
      <p>{offer.description}</p>
      <Space size={[0, 8]} wrap>
        {offer.tags.map((tag) => (
          <Tag key={tag}>{tag}</Tag>
        ))}
      </Space>
    </Card>
  );
}
```

**Características**:
- ✅ Props tipadas com interface
- ✅ Valores default em props (`showActions = true`)
- ✅ Optional chaining (`onSelect?.()`)
- ✅ Handlers nomeados (`handleView`, `handleSelect`)
- ✅ Seções comentadas para organização
- ✅ 'use client' se usar hooks

### Pattern 2: Form Component

```tsx
// src/components/features/requests/request-form.tsx
'use client';

import { Form, Input, Button, message } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { requestsService } from '@/services';
import { CreateRequestDto } from '@/lib/types';

// ========== Props Interface ==========
interface RequestFormProps {
  offerId: string;
  onSuccess?: () => void;
  onCancel?: () => void;
}

// ========== Component ==========
export function RequestForm({ offerId, onSuccess, onCancel }: RequestFormProps) {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  // ========== Mutations ==========
  const { mutate: createRequest, isPending } = useMutation({
    mutationFn: (data: CreateRequestDto) => requestsService.createRequest(data),
    onSuccess: () => {
      message.success('Requisição criada com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['requests'] });
      form.resetFields();
      onSuccess?.();
    },
    onError: (error) => {
      message.error(error instanceof Error ? error.message : 'Erro ao criar requisição');
    },
  });

  // ========== Handlers ==========
  const handleSubmit = (values: { description: string }) => {
    createRequest({
      offerId,
      description: values.description,
    });
  };

  // ========== Render ==========
  return (
    <Form form={form} onFinish={handleSubmit} layout="vertical">
      <Form.Item
        name="description"
        label="Descrição"
        rules={[
          { required: true, message: 'Descrição obrigatória' },
          { min: 10, message: 'Mínimo 10 caracteres' },
        ]}
      >
        <Input.TextArea rows={4} placeholder="Descreva sua solicitação..." />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit" loading={isPending}>
          Criar Requisição
        </Button>
        {onCancel && (
          <Button onClick={onCancel} style={{ marginLeft: 8 }}>
            Cancelar
          </Button>
        )}
      </Form.Item>
    </Form>
  );
}
```

**Características**:
- ✅ Form instance com `Form.useForm()`
- ✅ useMutation para POST/PUT
- ✅ Invalidate queries em onSuccess
- ✅ Error handling com message.error
- ✅ Loading state em botão
- ✅ Validação de campos com rules

### Pattern 3: List Component

```tsx
// src/components/features/offers/offer-list.tsx
'use client';

import { Row, Col, Empty, Spin, Alert } from 'antd';
import { useQuery } from '@tanstack/react-query';
import { catalogService } from '@/services';
import { OfferCard } from './offer-card';

// ========== Props Interface ==========
interface OfferListProps {
  onSelectOffer?: (offerId: string) => void;
}

// ========== Component ==========
export function OfferList({ onSelectOffer }: OfferListProps) {
  // ========== Queries ==========
  const {
    data: offers,
    isLoading,
    isError,
    error,
  } = useQuery({
    queryKey: ['offers'],
    queryFn: () => catalogService.listOffers(),
  });

  // ========== Loading State ==========
  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  // ========== Error State ==========
  if (isError) {
    return (
      <Alert
        type="error"
        message="Erro ao carregar ofertas"
        description={error instanceof Error ? error.message : 'Erro desconhecido'}
        showIcon
      />
    );
  }

  // ========== Empty State ==========
  if (!offers || offers.length === 0) {
    return (
      <Empty
        description="Nenhuma oferta disponível"
        image={Empty.PRESENTED_IMAGE_SIMPLE}
      />
    );
  }

  // ========== Success State ==========
  return (
    <Row gutter={[16, 16]}>
      {offers.map((offer) => (
        <Col key={offer.id} xs={24} sm={12} lg={8}>
          <OfferCard offer={offer} onSelect={onSelectOffer} />
        </Col>
      ))}
    </Row>
  );
}
```

**Características**:
- ✅ useQuery para GET
- ✅ Estados explícitos (loading, error, empty, success)
- ✅ Early returns para cada estado
- ✅ Grid responsivo com Ant Design
- ✅ Composição de componentes (OfferCard)

## 📦 Ant Design Usage

### Imports Corretos

```tsx
// ✅ BOM - Named imports específicos
import { Button, Form, Input, Card } from 'antd';

// ❌ RUIM - Default import
import Antd from 'antd';
```

### Componentes Mais Usados

#### 1. Form

```tsx
import { Form, Input, Button } from 'antd';

function MyForm() {
  const [form] = Form.useForm();

  const handleSubmit = (values: { name: string }) => {
    console.log(values);
  };

  return (
    <Form form={form} onFinish={handleSubmit} layout="vertical">
      <Form.Item
        name="name"
        label="Nome"
        rules={[{ required: true, message: 'Campo obrigatório' }]}
      >
        <Input placeholder="Digite o nome" />
      </Form.Item>

      <Form.Item>
        <Button type="primary" htmlType="submit">
          Salvar
        </Button>
      </Form.Item>
    </Form>
  );
}
```

#### 2. Table

```tsx
import { Table } from 'antd';
import type { ColumnsType } from 'antd/es/table';

interface DataType {
  id: string;
  name: string;
  status: string;
}

function MyTable() {
  const columns: ColumnsType<DataType> = [
    { title: 'ID', dataIndex: 'id', key: 'id' },
    { title: 'Nome', dataIndex: 'name', key: 'name' },
    {
      title: 'Status',
      dataIndex: 'status',
      key: 'status',
      render: (status) => (
        <Tag color={status === 'active' ? 'green' : 'red'}>
          {status}
        </Tag>
      ),
    },
  ];

  return (
    <Table
      columns={columns}
      dataSource={data}
      rowKey="id"
      loading={isLoading}
      pagination={{ pageSize: 10 }}
    />
  );
}
```

#### 3. Modal

```tsx
import { Modal, Button } from 'antd';
import { useState } from 'react';

function MyModal() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>Abrir Modal</Button>

      <Modal
        title="Título"
        open={open}
        onOk={() => setOpen(false)}
        onCancel={() => setOpen(false)}
        okText="Confirmar"
        cancelText="Cancelar"
      >
        <p>Conteúdo do modal</p>
      </Modal>
    </>
  );
}
```

#### 4. Select

```tsx
import { Select, Form } from 'antd';

function MySelect() {
  return (
    <Form.Item name="role" label="Role">
      {/* Single select */}
      <Select placeholder="Selecione">
        <Select.Option value="admin">Admin</Select.Option>
        <Select.Option value="user">User</Select.Option>
      </Select>

      {/* Multiple select */}
      <Select mode="multiple" placeholder="Selecione múltiplos">
        <Select.Option value="admin">Admin</Select.Option>
        <Select.Option value="editor">Editor</Select.Option>
      </Select>

      {/* Tags mode (aceita valores customizados) */}
      <Select mode="tags" placeholder="Digite tags" />
    </Form.Item>
  );
}
```

## 🛠️ Componentes Principais

### 1. AppHeader

```tsx
// src/components/app-header.tsx
'use client';

import { Layout, Dropdown, Button, Space, Badge } from 'antd';
import { UserOutlined, LogoutOutlined } from '@ant-design/icons';
import { useAuth } from '@/lib/contexts/auth.context';
import { useRouter } from 'next/navigation';
import type { MenuProps } from 'antd';

const { Header } = Layout;

export function AppHeader() {
  const { user, roles, logout } = useAuth();
  const router = useRouter();

  const menuItems: MenuProps['items'] = [
    {
      key: 'profile',
      icon: <UserOutlined />,
      label: user?.userName,
    },
    {
      key: 'roles',
      label: (
        <Space>
          Roles:
          <Badge count={roles?.length || 0} showZero color="blue" />
        </Space>
      ),
      disabled: true,
    },
    { type: 'divider' },
    {
      key: 'logout',
      icon: <LogoutOutlined />,
      label: 'Sair',
      danger: true,
      onClick: () => {
        logout();
        router.push('/login');
      },
    },
  ];

  return (
    <Header style={{ background: '#fff', padding: '0 24px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>ORCA</h1>
        <Dropdown menu={{ items: menuItems }} placement="bottomRight">
          <Button icon={<UserOutlined />}>
            {user?.userName}
          </Button>
        </Dropdown>
      </div>
    </Header>
  );
}
```

**Responsabilidades**:
- Exibir logo/título da aplicação
- Menu dropdown do usuário com roles
- Botão de logout
- Navegação rápida (opcional)

### 2. ProtectedRoute

```tsx
// src/components/protected-route.tsx
'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/contexts/auth.context';
import { Spin, Alert } from 'antd';

interface ProtectedRouteProps {
  children: React.ReactNode;
  requiredRoles?: string[];
}

export function ProtectedRoute({ children, requiredRoles = [] }: ProtectedRouteProps) {
  const { isAuthenticated, isLoading, roles } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login');
    }
  }, [isAuthenticated, isLoading, router]);

  if (isLoading) {
    return (
      <div style={{ textAlign: 'center', padding: '50px 0' }}>
        <Spin size="large" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  // Check roles if required
  if (requiredRoles.length > 0) {
    const requiredRoleNames = requiredRoles.map((role) => role.toLowerCase());
    const userRoleNames = (roles || []).map((role) => role.name.toLowerCase());
    const hasRequiredRole = userRoleNames.some((roleName) =>
      requiredRoleNames.includes(roleName)
    );

    if (!hasRequiredRole) {
      return (
        <Alert
          type="error"
          message="Acesso Negado"
          description={`Você precisa de uma das seguintes roles: ${requiredRoles.join(', ')}`}
          showIcon
        />
      );
    }
  }

  return <>{children}</>;
}
```

**Uso**:

```tsx
// Em páginas protegidas
export default function AdminPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'superadmin']}>
      <h1>Admin Dashboard</h1>
    </ProtectedRoute>
  );
}
```

### 3. UI Components

#### LoadingSpinner

```tsx
// src/components/ui/loading-spinner.tsx
import { Spin } from 'antd';

interface LoadingSpinnerProps {
  size?: 'small' | 'default' | 'large';
  tip?: string;
}

export function LoadingSpinner({ size = 'large', tip }: LoadingSpinnerProps) {
  return (
    <div style={{ textAlign: 'center', padding: '50px 0' }}>
      <Spin size={size} tip={tip} />
    </div>
  );
}
```

#### EmptyState

```tsx
// src/components/ui/empty-state.tsx
import { Empty, Button } from 'antd';

interface EmptyStateProps {
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
}

export function EmptyState({ description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <Empty
      description={description || 'Nenhum dado encontrado'}
      image={Empty.PRESENTED_IMAGE_SIMPLE}
    >
      {actionLabel && onAction && (
        <Button type="primary" onClick={onAction}>
          {actionLabel}
        </Button>
      )}
    </Empty>
  );
}
```

#### ErrorAlert

```tsx
// src/components/ui/error-alert.tsx
import { Alert } from 'antd';

interface ErrorAlertProps {
  message?: string;
  error?: Error | unknown;
}

export function ErrorAlert({ message = 'Erro', error }: ErrorAlertProps) {
  const description = error instanceof Error ? error.message : 'Erro desconhecido';

  return (
    <Alert
      type="error"
      message={message}
      description={description}
      showIcon
      style={{ marginBottom: 16 }}
    />
  );
}
```

## ✅ Best Practices

### 1. Component Structure

```tsx
'use client'; // Se usar hooks

// ========== Imports ==========
import { useState } from 'react';
import { Button } from 'antd';
import { useAuth } from '@/lib/contexts/auth.context';

// ========== Types ==========
interface MyComponentProps {
  title: string;
  onAction?: () => void;
}

// ========== Component ==========
export function MyComponent({ title, onAction }: MyComponentProps) {
  // ========== State ==========
  const [count, setCount] = useState(0);

  // ========== Hooks ==========
  const { user } = useAuth();

  // ========== Handlers ==========
  const handleClick = () => {
    setCount(count + 1);
    onAction?.();
  };

  // ========== Effects ==========
  useEffect(() => {
    // Side effects
  }, []);

  // ========== Render ==========
  return (
    <div>
      <h1>{title}</h1>
      <p>Count: {count}</p>
      <Button onClick={handleClick}>Incrementar</Button>
    </div>
  );
}
```

### 2. Naming Conventions

```tsx
// ✅ BOM
function OfferCard() {}        // PascalCase para componentes
const handleSubmit = () => {}  // camelCase para handlers
const isLoading = true;        // camelCase para variáveis
interface OfferCardProps {}    // PascalCase + Props suffix

// ❌ RUIM
function offer_card() {}
const HandleSubmit = () => {}
const IsLoading = true;
interface offerCardProperties {}
```

### 3. Props Defaults

```tsx
// ✅ BOM - Default em destructuring
function MyComponent({ 
  size = 'default',
  showActions = true,
  onAction 
}: MyComponentProps) {
  // ...
}

// ❌ RUIM - Default dentro do componente
function MyComponent(props: MyComponentProps) {
  const size = props.size || 'default';
  const showActions = props.showActions !== undefined ? props.showActions : true;
}
```

### 4. Optional Callbacks

```tsx
// ✅ BOM - Optional chaining
const handleClick = () => {
  onAction?.();
};

// ❌ RUIM - Manual check
const handleClick = () => {
  if (onAction) {
    onAction();
  }
};
```

### 5. State Management

```tsx
// ✅ BOM - TanStack Query para server state
const { data: offers } = useQuery({
  queryKey: ['offers'],
  queryFn: () => catalogService.listOffers(),
});

// ❌ RUIM - useState para server state
const [offers, setOffers] = useState([]);
useEffect(() => {
  catalogService.listOffers().then(setOffers);
}, []);
```

### 6. Conditional Rendering

```tsx
// ✅ BOM - Early returns
if (isLoading) return <Spin />;
if (isError) return <Alert type="error" />;
if (!data) return <Empty />;

return <div>{data.name}</div>;

// ❌ RUIM - Nested ternários
return (
  <div>
    {isLoading ? (
      <Spin />
    ) : isError ? (
      <Alert type="error" />
    ) : !data ? (
      <Empty />
    ) : (
      <div>{data.name}</div>
    )}
  </div>
);
```

## 📚 Resumo

| Tipo | Localização | Exemplo | Quando Usar |
|------|-------------|---------|-------------|
| **Root** | `/components` | `app-header.tsx` | Componentes globais |
| **Feature** | `/components/features/[domain]` | `offer-card.tsx` | Componentes de domínio |
| **Layout** | `/components/layouts` | `dashboard-layout.tsx` | Estruturas de página |
| **UI** | `/components/ui` | `loading-spinner.tsx` | Componentes reutilizáveis |

**Patterns Essenciais**:
- ✅ Props tipadas com interface
- ✅ Default values em destructuring
- ✅ Optional chaining para callbacks
- ✅ Early returns para estados
- ✅ Handlers nomeados (`handleX`)
- ✅ Seções comentadas (Imports, Types, State, Handlers, Render)

**Resultado**: Componentes organizados, testáveis e reutilizáveis. 🎨
