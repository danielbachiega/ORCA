# 🌐 Orca.Gateway API

Gateway de entrada do ORCA usando **YARP (Yet Another Reverse Proxy)**.

## 🎯 Objetivo

O `Orca.Gateway` centraliza:

- Roteamento para os microserviços (`identity`, `catalog`, `forms`, `requests`, `orchestrator`)
- Validação de JWT no ponto de entrada
- Exposição de endpoints públicos específicos (ex.: login)
- Swagger agregada em um único endereço

## 🔐 Segurança

### Rotas públicas

- `POST /api/identity/auth/login`
- `GET /health`
- `GET /`
- `GET /image-assets/{**catch-all}`

### Rotas protegidas (JWT obrigatório)

- `GET/POST/... /api/identity/{**catch-all}` (exceto login)
- `GET/POST/... /api/catalog/{**catch-all}`
- `GET/POST/... /api/forms/{**catch-all}`
- `GET/POST/... /api/requests/{**catch-all}`
- `GET/POST/... /api/orchestrator/{**catch-all}`

> Nesta configuração atual, o Swagger do gateway não exige token para abrir a UI e carregar os JSONs agregados.

## 🌍 CORS (desenvolvimento)

- Configuração atual do gateway: `AllowAnyOrigin + AllowAnyHeader + AllowAnyMethod`
- Objetivo: facilitar integração local com o `orca-web` sem bloqueio de preflight (`OPTIONS`)
- **Atenção:** em produção, restringir origens explicitamente

## 🧭 Rotas principais

| Prefixo externo | Destino interno |
|---|---|
| `/image-assets/*` | `catalog-api:5001/image-assets/*` |
| `/api/identity/*` | `identity-api:5002/api/*` |
| `/api/catalog/*` | `catalog-api:5001/api/*` |
| `/api/forms/*` | `forms-api:5003/api/*` |
| `/api/requests/*` | `requests-api:5004/api/*` |
| `/api/orchestrator/*` | `orchestrator-api:5005/api/*` |

## 📚 Swagger agregada

Endpoint da UI:

- `http://localhost:5000/swagger`

Docs disponíveis no portal:

- `Gateway v1`
- `Identity API`
- `Catalog API`
- `Forms API`
- `Requests API`
- `Orchestrator API`

JSONs expostos pelo gateway:

- `/swagger/identity/swagger.json`
- `/swagger/catalog/swagger.json`
- `/swagger/forms/swagger.json`
- `/swagger/requests/swagger.json`
- `/swagger/orchestrator/swagger.json`

## ▶️ Execução local

Na raiz do projeto:

```bash
podman-compose up -d --build gateway-api
```

## 🧪 Teste rápido

1. Fazer login no gateway:

```bash
curl -sS -X POST http://localhost:5000/api/identity/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin321"}'
```

2. Usar `sessionToken` retornado para acessar rota protegida:

```bash
curl -sS http://localhost:5000/api/catalog/offers \
  -H "Authorization: Bearer <sessionToken>"
```

3. Acessar Swagger JSON (sem token na configuração atual):

```bash
curl -sS http://localhost:5000/swagger/catalog/swagger.json
```

## 📂 Arquivos-chave

- `services/Orca.Gateway/Orca.Gateway.Api/Orca.Gateway.Api/Program.cs`
- `services/Orca.Gateway/Orca.Gateway.Api/Orca.Gateway.Api/appsettings.json`
- `services/Orca.Gateway/Orca.Gateway.Api/Orca.Gateway.Api/Orca.Gateway.Api.http`
