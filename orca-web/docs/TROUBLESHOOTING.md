# 🔧 Troubleshooting Guide - ORCA Web

Guia completo de resolução de problemas comuns.

## 📋 Índice

1. [Autenticação](#autenticação)
2. [CORS](#cors)
3. [TypeScript](#typescript)
4. [TanStack Query](#tanstack-query)
5. [Docker](#docker)
6. [Ant Design](#ant-design)
7. [Build & Deploy](#build--deploy)

## 🔐 Autenticação

### Problema: "roles is undefined"

**Sintoma**:
```
TypeError: Cannot read properties of undefined (reading 'some')
```

**Causa**:
AuthContext pode retornar `roles` como `undefined` durante inicialização.

**Solução**:
```tsx
// ❌ RUIM
const isAdmin = roles.some(r => r.name === 'admin');

// ✅ BOM
const isAdmin = roles && roles.length > 0 && roles.some(r => r.name === 'admin');

// 🚀 MELHOR - Optional chaining
const isAdmin = roles?.some(r => r.name === 'admin') ?? false;
```

**Fix em Produção**:
```tsx
// src/components/app-header.tsx
const { roles } = useAuth();
const isAdmin = roles?.some(r => 
  r.name.toLowerCase() === 'admin' || r.name.toLowerCase() === 'superadmin'
) ?? false;
```

### Problema: Token não está sendo enviado

**Sintoma**:
```
401 Unauthorized em todas as requests
```

**Causa**:
ApiClient não tem o token configurado após login.

**Solução**:
```tsx
// src/lib/contexts/auth.context.tsx
const login = async (username: string, password: string) => {
  const response = await identityService.login(username, password);
  
  // ✅ Sincronizar token em TODOS os services
  identityService.setToken(response.sessionToken);
  catalogService.setToken(response.sessionToken);
  requestsService.setToken(response.sessionToken);
  orchestratorService.setToken(response.sessionToken);
  
  setSessionToken(response.sessionToken);
};
```

**Verificar Token**:
```tsx
// Browser DevTools → Console
console.log(localStorage.getItem('orca:sessionToken'));
```

### Problema: Usuário admin não tem acesso

**Sintoma**:
```
Usuário "admin" aparece com role Consumer ao invés de Admin
```

**Causa**:
Backend LDAP mock retornando grupos errados.

**Solução**:
```csharp
// services/Orca.Identity/Infrastructure/Ldap/LdapClient.cs
var mockGroups = username switch
{
    "superadmin" => new List<string> { "Admins", "TI" },
    "admin" => new List<string> { "Admins", "TI", "Developers" },
    "editor" => new List<string> { "Editors", "Developers" },
    "consumer" => new List<string> { "Users" },
    _ => new List<string> { "Users" }
};
```

### Problema: "Cannot update component while rendering"

**Sintoma**:
```
Warning: Cannot update a component while rendering a different component
```

**Causa**:
`router.push()` chamado durante render em ProtectedRoute.

**Solução**:
```tsx
// ❌ RUIM
export function ProtectedRoute({ children }: Props) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (!isLoading && !isAuthenticated) {
    router.push('/login'); // ⚠️ Side effect durante render
  }
  
  return <>{children}</>;
}

// ✅ BOM - Side effect em useEffect
export function ProtectedRoute({ children }: Props) {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push('/login'); // ✅ Side effect no hook
    }
  }, [isAuthenticated, isLoading, router]);
  
  return <>{children}</>;
}
```

## 🌐 CORS

### Problema: CORS error ao chamar APIs

**Sintoma**:
```
Access to XMLHttpRequest at 'http://localhost:5001/api/offers' from origin 'http://localhost:3000'
has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present
```

**Causa**:
Backend não configurado para aceitar requests do frontend.

**Solução**:
```csharp
// services/Orca.[Service].Api/Program.cs
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowFrontend", policy =>
    {
        policy.WithOrigins("http://localhost:3000", "http://localhost:3001")
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

// ...

app.UseCors("AllowFrontend");
```

**Verificar CORS**:
```bash
# Browser DevTools → Network → Headers → Response Headers
Access-Control-Allow-Origin: http://localhost:3000
```

### Problema: Preflight OPTIONS failing

**Sintoma**:
```
OPTIONS request returning 404
```

**Causa**:
CORS middleware não aplicado antes do routing.

**Solução**:
```csharp
// Program.cs - ORDEM IMPORTA!
app.UseCors("AllowFrontend"); // ✅ Antes do UseAuthorization
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
```

## 📘 TypeScript

### Problema: "Property does not exist on type"

**Sintoma**:
```typescript
Property 'active' does not exist on type 'Offer'
```

**Causa**:
Interface não sincronizada com backend.

**Solução**:
```typescript
// src/lib/types/index.ts
export interface Offer {
  id: string;
  slug: string;
  name: string;
  description?: string;
  tags: string[];
  active: boolean; // ✅ Adicionar campo faltante
  createdAtUtc: string;
  updatedAtUtc?: string;
  formSchemaJson?: string;
  visibleToRoles?: string[];
}
```

**Debugging**:
```typescript
// Inspecionar response real no DevTools → Network
console.log('Backend response:', response);

// Verificar quais campos estão faltando
type MissingFields = keyof BackendOfferType; // Type error aponta campos faltantes
```

### Problema: "Type 'undefined' is not assignable"

**Sintoma**:
```typescript
const userName = user.userName; // ❌ user pode ser undefined
```

**Causa**:
TypeScript strict mode não permite undefined sem checagem.

**Solução**:
```typescript
// ❌ RUIM
const userName = user.userName;

// ✅ BOM - Optional chaining
const userName = user?.userName;

// ✅ BOM - Default value
const userName = user?.userName || 'Anônimo';

// ✅ BOM - Early return
if (!user) return null;
const userName = user.userName;
```

### Problema: "any type is not allowed"

**Sintoma**:
```typescript
error TS2339: Property 'any' is not allowed when 'noImplicitAny' is enabled
```

**Causa**:
tsconfig.json com strict mode ativado.

**Solução**:
```typescript
// ❌ RUIM
const handleSubmit = (values: any) => {
  // ...
};

// ✅ BOM - Tipo específico
interface FormValues {
  name: string;
  description: string;
}

const handleSubmit = (values: FormValues) => {
  // ...
};

// ✅ BOM - Generic unknown se tipo realmente desconhecido
const handleError = (error: unknown) => {
  if (error instanceof Error) {
    console.error(error.message);
  }
};
```

## 🔄 TanStack Query

### Problema: Query não atualiza após mutação

**Sintoma**:
```
Criar oferta funciona, mas lista não atualiza
```

**Causa**:
Cache não invalidado após mutação.

**Solução**:
```typescript
// ❌ RUIM
const { mutate: createOffer } = useMutation({
  mutationFn: (data) => catalogService.createOffer(data),
  onSuccess: () => {
    message.success('Oferta criada!');
    // ⚠️ Cache não atualizado
  },
});

// ✅ BOM
const queryClient = useQueryClient();

const { mutate: createOffer } = useMutation({
  mutationFn: (data) => catalogService.createOffer(data),
  onSuccess: () => {
    message.success('Oferta criada!');
    queryClient.invalidateQueries({ queryKey: ['offers'] }); // ✅ Invalida cache
  },
});
```

### Problema: Queries duplicadas

**Sintoma**:
```
Network mostra 5 requests GET /api/offers simultâneas
```

**Causa**:
Múltiplos componentes usando mesma query sem deduplicação.

**Solução**:
TanStack Query já deduplica automaticamente! Problema pode ser:

```typescript
// ❌ RUIM - queryKey diferente para mesma data
useQuery({ queryKey: ['offers-1'], queryFn: () => catalogService.listOffers() });
useQuery({ queryKey: ['offers-2'], queryFn: () => catalogService.listOffers() });

// ✅ BOM - queryKey consistente
useQuery({ queryKey: ['offers'], queryFn: () => catalogService.listOffers() });
useQuery({ queryKey: ['offers'], queryFn: () => catalogService.listOffers() });
// → TanStack Query faz apenas 1 request
```

### Problema: Cache muito agressivo

**Sintoma**:
```
Data sempre cached, nunca refetch
```

**Causa**:
staleTime muito alto.

**Solução**:
```typescript
// src/lib/providers.tsx
export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5, // 5 minutos
        gcTime: 1000 * 60 * 10, // 10 minutos
        retry: 1,
        refetchOnWindowFocus: false, // Desabilita refetch ao focar janela
      },
    },
  }));

  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}
```

**Forçar Refetch**:
```typescript
const { data, refetch } = useQuery({
  queryKey: ['offers'],
  queryFn: () => catalogService.listOffers(),
});

// Botão manual
<Button onClick={() => refetch()}>Atualizar</Button>
```

## 🐳 Docker

### Problema: Container não inicia

**Sintoma**:
```
ERROR: Container orca-web exited with code 1
```

**Debug**:
```bash
# Ver logs do container
docker logs orca-web

# Ver containers rodando
docker ps -a

# Restart container específico
docker-compose restart orca-web

# Rebuild completo
docker-compose down
docker-compose up --build
```

### Problema: "Module not found" no container

**Sintoma**:
```
Error: Cannot find module 'next/dist/...'
```

**Causa**:
node_modules não instalados no container ou desatualizados.

**Solução**:
```dockerfile
# Dockerfile - Garantir multi-stage build correto
FROM node:18-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --legacy-peer-deps

FROM node:18-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .
RUN npm run build

FROM node:18-alpine AS runner
WORKDIR /app
COPY --from=builder /app/.next ./.next
COPY --from=builder /app/node_modules ./node_modules
COPY package.json ./
CMD ["npm", "start"]
```

**Rebuild**:
```bash
docker-compose down
docker-compose build --no-cache orca-web
docker-compose up orca-web
```

### Problema: Variáveis de ambiente não funcionam

**Sintoma**:
```
process.env.NEXT_PUBLIC_API_URL is undefined
```

**Causa**:
Variáveis não disponíveis no build time ou runtime.

**Solução**:
```yaml
# docker-compose.yml
services:
  orca-web:
    environment:
      - NEXT_PUBLIC_API_URL=http://localhost:3000/api
      - NODE_ENV=production
    # OU
    env_file:
      - .env.local
```

**Build Time vs Runtime**:
```typescript
// Build time (embedded no bundle)
console.log(process.env.NEXT_PUBLIC_API_URL);

// Runtime (server-side)
export async function getServerSideProps() {
  console.log(process.env.API_SECRET); // ✅ Só funciona server-side
}
```

## 🎨 Ant Design

### Problema: Deprecation warnings

**Sintoma**:
```
Warning: [antd: Alert] `message` is deprecated. Please use `title` instead.
```

**Solução**:
```tsx
// ❌ DEPRECATED
<Alert message="Erro" />
<Space direction="vertical" />

// ✅ CORRETO
<Alert title="Erro" />
<Space orientation="vertical" />
```

### Problema: Form não submete

**Sintoma**:
```
onFinish não é chamado ao clicar no botão
```

**Causa**:
Validação falhou ou botão não é type="submit".

**Solução**:
```tsx
// ✅ Estrutura correta
<Form form={form} onFinish={handleSubmit}>
  <Form.Item
    name="name"
    rules={[{ required: true, message: 'Obrigatório' }]} // ✅ Validação
  >
    <Input />
  </Form.Item>
  
  <Button type="primary" htmlType="submit"> {/* ✅ htmlType="submit" */}
    Salvar
  </Button>
</Form>
```

**Debug**:
```tsx
// Ver valores e erros do form
<Button onClick={() => {
  console.log('Values:', form.getFieldsValue());
  console.log('Errors:', form.getFieldsError());
}}>
  Debug Form
</Button>
```

### Problema: Select mode="tags" não aceita valores customizados

**Sintoma**:
```
Digitando tags mas nada acontece
```

**Causa**:
Faltando tokenSeparators.

**Solução**:
```tsx
// ❌ RUIM
<Select mode="tags" />

// ✅ BOM
<Select
  mode="tags"
  tokenSeparators={[',', ' ']} // ✅ Enter, vírgula ou espaço criam tag
  placeholder="Digite tags e pressione Enter"
/>
```

## 🚀 Build & Deploy

### Problema: Build falha com type errors

**Sintoma**:
```bash
npm run build
# Type error: Property 'xyz' does not exist
```

**Solução**:
```bash
# 1. Limpar cache
rm -rf .next
rm -rf node_modules/.cache

# 2. Reinstalar dependências
npm ci

# 3. Verificar tipos
npm run type-check

# 4. Build
npm run build
```

### Problema: "EMFILE: too many open files"

**Sintoma**:
```
Error: EMFILE: too many open files
```

**Causa**:
macOS/Linux file limit muito baixo.

**Solução**:
```bash
# Aumentar file limit (macOS)
ulimit -n 65536

# Verificar
ulimit -n

# Permanente (macOS)
echo "ulimit -n 65536" >> ~/.zshrc
```

### Problema: Imagens não aparecem em produção

**Sintoma**:
```
Images work in dev but not in production
```

**Causa**:
Next.js Image Optimization requires configuration.

**Solução**:
```typescript
// next.config.ts
const nextConfig = {
  images: {
    domains: ['localhost', 'your-cdn.com'],
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.example.com',
      },
    ],
  },
};
```

## 🔍 Debug Tools

### React DevTools

```bash
# Instalar extensão
# Chrome: https://chrome.google.com/webstore/detail/react-developer-tools/
```

**Uso**:
- Components tab → Inspecionar props/state
- Profiler tab → Performance analysis

### TanStack Query DevTools

```tsx
// Já incluído no projeto
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

<QueryClientProvider client={queryClient}>
  <ReactQueryDevtools initialIsOpen={false} />
</QueryClientProvider>
```

**Uso**:
- Ver queries ativas, cached, stale
- Refetch manual
- Inspecionar cache data

### Network Tab (Browser)

**Análise de Requests**:
1. Abrir DevTools → Network
2. Filtrar por `Fetch/XHR`
3. Clicar em request → Headers/Preview/Response

**Verificar**:
- ✅ Authorization header presente
- ✅ Request payload correto
- ✅ Response status 200-299
- ✅ Response data estrutura correta

### Console Logging

```tsx
// Debug auth
console.log('Auth state:', { isAuthenticated, user, roles });

// Debug query
const { data } = useQuery({
  queryKey: ['offers'],
  queryFn: async () => {
    const result = await catalogService.listOffers();
    console.log('Offers fetched:', result);
    return result;
  },
});

// Debug mutation
const { mutate } = useMutation({
  mutationFn: async (data) => {
    console.log('Mutation input:', data);
    const result = await catalogService.createOffer(data);
    console.log('Mutation result:', result);
    return result;
  },
});
```

## 📚 Checklist de Debug

Quando algo não funciona:

- [ ] Console tem erros? (Browser DevTools → Console)
- [ ] Network requests falhando? (DevTools → Network)
- [ ] TypeScript types corretos? (`npm run type-check`)
- [ ] Variáveis de ambiente configuradas? (`.env.local`)
- [ ] Docker containers healthy? (`docker ps`)
- [ ] Backend APIs respondendo? (`curl http://localhost:5001/health`)
- [ ] Token válido no localStorage? (`localStorage.getItem('orca:sessionToken')`)
- [ ] CORS configurado no backend? (Headers → `Access-Control-Allow-Origin`)
- [ ] Cache do TanStack Query? (React Query DevTools)
- [ ] Roles corretas? (`console.log(roles)`)

## 🆘 Ajuda Adicional

Se o problema persistir:

1. **Limpar tudo e recomeçar**:
```bash
# Frontend
rm -rf node_modules .next
npm ci
npm run build

# Docker
docker-compose down -v
docker-compose up --build
```

2. **Verificar versões**:
```bash
node -v  # Deve ser >= 18.x
npm -v   # Deve ser >= 9.x
```

3. **Consultar documentação**:
- [Next.js Docs](https://nextjs.org/docs)
- [TanStack Query Docs](https://tanstack.com/query/latest)
- [Ant Design Docs](https://ant.design/components/overview)

4. **Reportar issue**:
- Incluir logs completos
- Incluir stack trace
- Incluir steps to reproduce

**Boa sorte! 🚀**
