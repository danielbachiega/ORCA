# 📚 Documentação ORCA Web - Índice

Bem-vindo à documentação completa do frontend ORCA! Este índice te ajuda a encontrar rapidamente o que precisa.

## 🎯 Por Onde Começar?

### Novo no Projeto?
1. 📖 Comece pelo [README principal](../README.md) para visão geral
2. 🏗️ Leia [ARCHITECTURE.md](./ARCHITECTURE.md) para entender a estrutura
3. 👨‍💻 Siga [DEVELOPMENT_GUIDE.md](./DEVELOPMENT_GUIDE.md) para começar a desenvolver

### Precisa de Referência Rápida?
- ⚡ [QUICK_REFERENCE.md](../QUICK_REFERENCE.md) - Comandos e snippets mais usados
- 🔧 [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) - Problemas comuns e soluções

### Quer Entender Algo Específico?
- 🔌 [API_ABSTRACTION.md](./API_ABSTRACTION.md) - Como funciona a camada de API
- 🧩 [COMPONENTS.md](./COMPONENTS.md) - Padrões de componentes
- 🧪 [TESTING.md](./TESTING.md) - Como escrever testes

## 📋 Guia Completo por Tópico

### 1. Visão Geral e Setup

| Documento | Conteúdo | Quando Usar |
|-----------|----------|-------------|
| [README](../README.md) | Overview, features, stack, quick start | Primeira vez no projeto |
| [CHANGELOG](../CHANGELOG.md) | Histórico de mudanças e roadmap | Ver o que mudou, planejar features |
| [QUICK_REFERENCE](../QUICK_REFERENCE.md) | Comandos e snippets essenciais | Referência diária rápida |

### 2. Arquitetura e Padrões

| Documento | Conteúdo | Quando Usar |
|-----------|----------|-------------|
| [ARCHITECTURE](./ARCHITECTURE.md) | Clean Architecture, SOLID, camadas, decisões | Entender estrutura do projeto |
| [API_ABSTRACTION](./API_ABSTRACTION.md) | ApiClient, Services, migração Gateway | Trabalhar com APIs |
| [COMPONENTS](./COMPONENTS.md) | Padrões de componentes, Ant Design | Criar/modificar componentes |

### 3. Desenvolvimento

| Documento | Conteúdo | Quando Usar |
|-----------|----------|-------------|
| [DEVELOPMENT_GUIDE](./DEVELOPMENT_GUIDE.md) | Setup, conceitos, adicionar features | Desenvolver nova funcionalidade |
| [TESTING](./TESTING.md) | Unit, integration, E2E tests | Escrever testes |
| [TROUBLESHOOTING](./TROUBLESHOOTING.md) | Problemas comuns e soluções | Resolver bugs e erros |

## 🔍 Busca por Tópico

### Autenticação
- Como funciona: [ARCHITECTURE.md > Auth Flow](./ARCHITECTURE.md#fluxo-de-autenticação)
- Implementar login: [DEVELOPMENT_GUIDE.md > Conceitos Fundamentais](./DEVELOPMENT_GUIDE.md#conceitos-fundamentais)
- Problemas: [TROUBLESHOOTING.md > Autenticação](./TROUBLESHOOTING.md#autenticação)
- Testar: [TESTING.md > Testing Hooks](./TESTING.md#testing-hooks-context)

### APIs e Services
- Conceito: [API_ABSTRACTION.md > Por quê Abstrair](./API_ABSTRACTION.md#por-quê-abstrair)
- Criar service: [API_ABSTRACTION.md > Novo Service](./API_ABSTRACTION.md#novo-service)
- Exemplo: [DEVELOPMENT_GUIDE.md > Adicionar Features](./DEVELOPMENT_GUIDE.md#como-adicionar-novas-features)
- Testar: [TESTING.md > Testing Services](./TESTING.md#testing-services)

### Componentes
- Padrões: [COMPONENTS.md > Component Patterns](./COMPONENTS.md#component-patterns)
- Ant Design: [COMPONENTS.md > Ant Design Usage](./COMPONENTS.md#ant-design-usage)
- Best practices: [COMPONENTS.md > Best Practices](./COMPONENTS.md#best-practices)
- Testar: [TESTING.md > Testing Components](./TESTING.md#testing-components)

### TanStack Query
- Conceito: [ARCHITECTURE.md > TanStack Query](./ARCHITECTURE.md#por-que-tanstack-query)
- Uso: [DEVELOPMENT_GUIDE.md > TanStack Query](./DEVELOPMENT_GUIDE.md#tanstack-query)
- Patterns: [QUICK_REFERENCE.md > TanStack Query Patterns](../QUICK_REFERENCE.md#tanstack-query-patterns)
- Problemas: [TROUBLESHOOTING.md > TanStack Query](./TROUBLESHOOTING.md#tanstack-query)

### Protected Routes & RBAC
- Implementação: [COMPONENTS.md > ProtectedRoute](./COMPONENTS.md#protectedroute)
- Uso: [DEVELOPMENT_GUIDE.md > Protected Routes](./DEVELOPMENT_GUIDE.md#protected-routes)
- Exemplo: [QUICK_REFERENCE.md > Protected Route](../QUICK_REFERENCE.md#protected-route)
- Debug: [TROUBLESHOOTING.md > Roles undefined](./TROUBLESHOOTING.md#problema-roles-is-undefined)

### Forms
- Pattern: [COMPONENTS.md > Form Component](./COMPONENTS.md#pattern-2-form-component)
- Ant Design: [COMPONENTS.md > Ant Design > Form](./COMPONENTS.md#1-form)
- Validação: [QUICK_REFERENCE.md > Form Validation](../QUICK_REFERENCE.md#form-validation)
- Testar: [TESTING.md > Testing Forms](./TESTING.md#testing-forms-with-ant-design)

### Docker
- Setup: [README.md > Quick Start](../README.md#quick-start)
- Comandos: [QUICK_REFERENCE.md > Docker](../QUICK_REFERENCE.md#docker)
- Problemas: [TROUBLESHOOTING.md > Docker](./TROUBLESHOOTING.md#docker)

### TypeScript
- Strict mode: [ARCHITECTURE.md > TypeScript Strict](./ARCHITECTURE.md#por-que-typescript-strict)
- Types: [DEVELOPMENT_GUIDE.md > Domain Layer](./DEVELOPMENT_GUIDE.md#domain-layer)
- Erros: [TROUBLESHOOTING.md > TypeScript](./TROUBLESHOOTING.md#typescript)

## 📖 Fluxos Comuns

### Adicionar Nova Feature

1. 📋 Planejar: [DEVELOPMENT_GUIDE.md > Como Adicionar Features](./DEVELOPMENT_GUIDE.md#como-adicionar-novas-features)
2. 🎨 Criar tipos: [QUICK_REFERENCE.md > Novo Tipo](../QUICK_REFERENCE.md#novo-tipo-domain)
3. 🔌 Criar service: [QUICK_REFERENCE.md > Novo Service](../QUICK_REFERENCE.md#novo-service)
4. 🧩 Criar componentes: [COMPONENTS.md > Component Patterns](./COMPONENTS.md#component-patterns)
5. 📄 Criar página: [QUICK_REFERENCE.md > Nova Página](../QUICK_REFERENCE.md#nova-página-com-tanstack-query)
6. 🧪 Escrever testes: [TESTING.md > Unit Tests](./TESTING.md#unit-tests)

### Debug de Problema

1. 🔍 Identificar: [TROUBLESHOOTING.md > Checklist](./TROUBLESHOOTING.md#checklist-de-debug)
2. 🛠️ Ferramentas: [TROUBLESHOOTING.md > Debug Tools](./TROUBLESHOOTING.md#debug-tools)
3. 🔧 Resolver: [TROUBLESHOOTING.md > Por categoria](./TROUBLESHOOTING.md)
4. ✅ Testar: [TESTING.md](./TESTING.md)

### Onboarding de Novo Dev

**Dia 1 - Setup**
- [ ] Ler [README.md](../README.md) completo
- [ ] Seguir [DEVELOPMENT_GUIDE.md > Setup](./DEVELOPMENT_GUIDE.md#setup-do-ambiente)
- [ ] Rodar projeto com Docker
- [ ] Fazer login com credenciais de teste

**Dia 2 - Arquitetura**
- [ ] Ler [ARCHITECTURE.md](./ARCHITECTURE.md) completo
- [ ] Entender camadas da Clean Architecture
- [ ] Explorar codebase seguindo estrutura
- [ ] Ler [API_ABSTRACTION.md](./API_ABSTRACTION.md)

**Dia 3 - Prática**
- [ ] Seguir exemplo em [DEVELOPMENT_GUIDE.md > Adicionar Features](./DEVELOPMENT_GUIDE.md#como-adicionar-novas-features)
- [ ] Criar pequena feature de teste
- [ ] Escrever testes seguindo [TESTING.md](./TESTING.md)
- [ ] Fazer PR com a feature

**Dia 4+ - Produtividade**
- [ ] Favoritar [QUICK_REFERENCE.md](../QUICK_REFERENCE.md)
- [ ] Configurar ferramentas (DevTools, extensões)
- [ ] Ler [COMPONENTS.md](./COMPONENTS.md) para padrões
- [ ] Consultar [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) quando necessário

## 🆘 Precisa de Ajuda?

### Não encontrou o que precisa?

1. **Busque no código**: Use Ctrl+Shift+F no VS Code
2. **Console do browser**: F12 → Console/Network
3. **TanStack Query DevTools**: Botão flutuante no canto
4. **Pergunte ao time**: Slack #orca-frontend

### Encontrou erro na documentação?

1. Abra issue no repositório
2. Ou faça PR corrigindo
3. Seguir padrão de [Conventional Commits](https://www.conventionalcommits.org/)

## 📊 Status da Documentação

| Documento | Status | Última Atualização |
|-----------|--------|-------------------|
| README.md | ✅ Completo | 2024-01-15 |
| ARCHITECTURE.md | ✅ Completo | 2024-01-15 |
| DEVELOPMENT_GUIDE.md | ✅ Completo | 2024-01-15 |
| API_ABSTRACTION.md | ✅ Completo | 2024-01-15 |
| COMPONENTS.md | ✅ Completo | 2024-01-15 |
| TROUBLESHOOTING.md | ✅ Completo | 2024-01-15 |
| TESTING.md | ✅ Completo | 2024-01-15 |
| CHANGELOG.md | ✅ Completo | 2024-01-15 |
| QUICK_REFERENCE.md | ✅ Completo | 2024-01-15 |

---

**Happy Coding! 🚀**

*Documentação mantida pela equipe ORCA - Sugestões e correções são bem-vindas!*
