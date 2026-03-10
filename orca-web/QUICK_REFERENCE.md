# ⚡ Quick Reference - ORCA Web

Comandos e snippets mais utilizados no dia a dia.

## 📋 Comandos Essenciais

### Desenvolvimento

```bash
# Instalar dependências
npm install

# Dev server (hot reload)
npm run dev

# Build production
npm run build

# Start production
npm start

# Lint
npm run lint
```

### Docker

```bash
# Subir todos os serviços
podman-compose up

# Subir em background
podman-compose up -d

# Ver logs
podman logs -f orca-web

# Rebuild completo
podman-compose down
podman-compose up --build

# Parar tudo
podman-compose down

# Limpar volumes
podman-compose down -v
```

### Git

```bash
# Criar branch
git checkout -b feature/minha-feature

# Commit (conventional commits)
git commit -m "feat: adiciona nova funcionalidade"
git commit -m "fix: corrige bug em autenticação"
git commit -m "docs: atualiza README"

# Push
git push origin feature/minha-feature
```

## 🆕 Novidades Rápidas (últimos commits)

- **Header com abas**: navegação principal consolidada no topo, com visibilidade por perfil.
- **Busca em listas**: "Minhas Requisições" busca por oferta, ID e status; "Gerenciar Imagens" busca por nome e slug.
- **Ofertas com imagem**: suporte completo a upload/listagem/remoção e vínculo da imagem na oferta.
- **Regra de visibilidade**: criação/edição de oferta sempre inclui `admin` em `visibleToRoles`.
- **Form Builder**:
  - regex para validação de texto (builder/preview/request)
  - visibilidade com suporte a boolean (checkbox)
  - reordenação por setas e drag-and-drop
  - opções via tags usando Enter e separador `;`

## 🧩 Code Snippets

### Nova Página com TanStack Query

```tsx
'use client';

import { useQuery } from '@tanstack/react-query';
import { Spin, Alert } from 'antd';
import { myService } from '@/services';

export default function MyPage() {
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ['my-data'],
    queryFn: () => myService.getData(),
  });

  if (isLoading) return <Spin />;
  if (isError) return <Alert type="error" message={error.message} />;

  return <div>{data?.name}</div>;
}
```

### Form com Mutation

```tsx
'use client';

import { Form, Input, Button, message } from 'antd';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { myService } from '@/services';

export default function MyForm() {
  const [form] = Form.useForm();
  const queryClient = useQueryClient();

  const { mutate, isPending } = useMutation({
    mutationFn: (data) => myService.create(data),
    onSuccess: () => {
      message.success('Criado com sucesso!');
      queryClient.invalidateQueries({ queryKey: ['my-data'] });
      form.resetFields();
    },
    onError: (error) => {
      message.error(error.message);
    },
  });

  return (
    <Form form={form} onFinish={mutate} layout="vertical">
      <Form.Item name="name" label="Nome" rules={[{ required: true }]}>
        <Input />
      </Form.Item>

      <Button type="primary" htmlType="submit" loading={isPending}>
        Salvar
      </Button>
    </Form>
  );
}
```

### Protected Route

```tsx
import { ProtectedRoute } from '@/components/protected-route';

export default function AdminPage() {
  return (
    <ProtectedRoute requiredRoles={['admin', 'superadmin']}>
      <h1>Admin Only</h1>
    </ProtectedRoute>
  );
}
```

### Novo Service

```typescript
// src/services/my-domain.service.ts
import { ApiClient } from '@/lib/utils/api-client';
import { API_CONFIG } from '@/lib/constants';
import { MyType } from '@/lib/types';

class MyDomainService {
  private client: ApiClient;

  constructor() {
    this.client = new ApiClient({
      baseURL: API_CONFIG.MY_API,
    });
  }

  async list(): Promise<MyType[]> {
    return this.client.get<MyType[]>('/api/resource');
  }

  async getById(id: string): Promise<MyType> {
    return this.client.get<MyType>(`/api/resource/${id}`);
  }

  async create(data: Partial<MyType>): Promise<MyType> {
    return this.client.post<MyType>('/api/resource', data);
  }

  setToken(token: string): void {
    this.client.setToken(token);
  }

  clearToken(): void {
    this.client.clearToken();
  }
}

export const myDomainService = new MyDomainService();
```

### Novo Tipo (Domain)

```typescript
// src/lib/types/index.ts
export interface MyEntity {
  id: string;
  name: string;
  description?: string;
  createdAtUtc: string;
  updatedAtUtc?: string;
}

export interface CreateMyEntityDto {
  name: string;
  description?: string;
}
```

### Component com useAuth

```tsx
'use client';

import { useAuth } from '@/lib/contexts/auth.context';
import { Button } from 'antd';

export function MyComponent() {
  const { user, roles, logout } = useAuth();

  const isAdmin = roles?.some(r => 
    r.name.toLowerCase() === 'admin'
  ) ?? false;

  return (
    <div>
      <p>Olá, {user?.userName}!</p>
      {isAdmin && <Button>Admin Action</Button>}
      <Button onClick={logout}>Sair</Button>
    </div>
  );
}
```

## 🔍 Debugging

### Browser Console

```javascript
// Ver token
localStorage.getItem('orca:sessionToken')

// Ver todos os dados do localStorage
Object.keys(localStorage).forEach(key => {
  console.log(key, localStorage.getItem(key));
});

// Limpar storage
localStorage.clear();

// Forçar logout
window.dispatchEvent(new Event('auth:unauthorized'));
```

### TanStack Query DevTools

```typescript
// Já incluído no projeto, abrir com:
// DevTools floating button (canto inferior direito)

// Comandos úteis:
// - Ver todas queries ativas
// - Invalidar query manualmente
// - Ver cache data
// - Ver query status (loading, success, error)
```

### Network Tab

```
1. F12 → Network
2. Filtrar: Fetch/XHR
3. Verificar:
   - Status code (200-299 = sucesso)
   - Authorization header presente?
   - Request payload correto?
   - Response data estrutura ok?
```

## 🛠️ Troubleshooting Rápido

### Erro: "roles is undefined"

```tsx
// ❌ RUIM
const isAdmin = roles.some(r => r.name === 'admin');

// ✅ BOM
const isAdmin = roles?.some(r => r.name === 'admin') ?? false;
```

### Erro: CORS

```bash
# Verificar CORS no backend
curl -H "Origin: http://localhost:3000" \
     -H "Access-Control-Request-Method: GET" \
     -X OPTIONS http://localhost:5001/api/offers
```

### Erro: "Cannot update component while rendering"

```tsx
// ❌ RUIM
if (!isAuthenticated) {
  router.push('/login'); // Durante render
}

// ✅ BOM
useEffect(() => {
  if (!isAuthenticated) {
    router.push('/login'); // Em effect
  }
}, [isAuthenticated]);
```

### Cache não atualiza

```tsx
// Invalidar query após mutation
const queryClient = useQueryClient();

queryClient.invalidateQueries({ queryKey: ['my-data'] });
```

### Build falha

```bash
# Limpar tudo
rm -rf .next node_modules
npm ci
npm run build
```

## 📝 Ant Design Quick Reference

### Form Validation

```tsx
<Form.Item
  name="email"
  rules={[
    { required: true, message: 'Email obrigatório' },
    { type: 'email', message: 'Email inválido' },
    { min: 5, message: 'Mínimo 5 caracteres' },
    { max: 50, message: 'Máximo 50 caracteres' },
    { 
      pattern: /^[a-z-]+$/,
      message: 'Apenas letras minúsculas e hífens'
    },
  ]}
>
  <Input />
</Form.Item>
```

### Table Columns

```tsx
const columns = [
  { title: 'ID', dataIndex: 'id', key: 'id' },
  { title: 'Nome', dataIndex: 'name', key: 'name' },
  {
    title: 'Status',
    key: 'status',
    render: (_, record) => (
      <Tag color={record.active ? 'green' : 'red'}>
        {record.active ? 'Ativo' : 'Inativo'}
      </Tag>
    ),
  },
  {
    title: 'Ações',
    key: 'actions',
    render: (_, record) => (
      <Button onClick={() => handleEdit(record.id)}>
        Editar
      </Button>
    ),
  },
];
```

### Modal

```tsx
const [open, setOpen] = useState(false);

<Button onClick={() => setOpen(true)}>Abrir</Button>

<Modal
  title="Título"
  open={open}
  onOk={() => setOpen(false)}
  onCancel={() => setOpen(false)}
>
  <p>Conteúdo</p>
</Modal>
```

### Message (Toast)

```tsx
import { message } from 'antd';

message.success('Sucesso!');
message.error('Erro!');
message.warning('Atenção!');
message.info('Informação');
message.loading('Carregando...', 2.5);
```

## 🎯 TanStack Query Patterns

### Pagination

```tsx
const [page, setPage] = useState(1);

const { data } = useQuery({
  queryKey: ['items', page],
  queryFn: () => myService.list(page),
  keepPreviousData: true, // Mantém dados anteriores durante fetch
});
```

### Dependent Queries

```tsx
const { data: user } = useQuery({
  queryKey: ['user'],
  queryFn: () => identityService.getMe(),
});

const { data: offers } = useQuery({
  queryKey: ['offers', user?.id],
  queryFn: () => catalogService.getOffersByUser(user!.id),
  enabled: !!user, // Só executa se user existir
});
```

### Refetch Manual

```tsx
const { data, refetch } = useQuery({
  queryKey: ['offers'],
  queryFn: () => catalogService.listOffers(),
});

<Button onClick={() => refetch()}>Atualizar</Button>
```

### Optimistic Updates

```tsx
const { mutate } = useMutation({
  mutationFn: (data) => myService.update(data),
  onMutate: async (newData) => {
    // Cancel queries
    await queryClient.cancelQueries({ queryKey: ['items'] });

    // Snapshot previous value
    const previous = queryClient.getQueryData(['items']);

    // Optimistically update
    queryClient.setQueryData(['items'], (old) => [...old, newData]);

    return { previous };
  },
  onError: (err, newData, context) => {
    // Rollback on error
    queryClient.setQueryData(['items'], context?.previous);
  },
  onSettled: () => {
    // Refetch after mutation
    queryClient.invalidateQueries({ queryKey: ['items'] });
  },
});
```

## 📚 Links Úteis

### Documentação Interna
- [README](./README.md)
- [Architecture](./docs/ARCHITECTURE.md)
- [Development Guide](./docs/DEVELOPMENT_GUIDE.md)
- [Troubleshooting](./docs/TROUBLESHOOTING.md)

### Docs Externas
- [Next.js Docs](https://nextjs.org/docs)
- [TanStack Query](https://tanstack.com/query/latest)
- [Ant Design](https://ant.design/components/overview)
- [TypeScript](https://www.typescriptlang.org/docs/)

---

**💡 Dica**: Adicione este arquivo aos favoritos para acesso rápido!
