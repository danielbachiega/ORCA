# ORCA Forms — FormDefinition Schema Guide

Este guia define o formato do `SchemaJson` salvo em `FormDefinition`. Ele é usado pelo frontend para renderizar formulários dinâmicos e validar campos. Não há `UiSchema` ou `Rules` separados: tudo fica em um único JSON.

## Campo único
- `SchemaJson` (JSON): fonte de verdade com campos, validações, hints de UI e opções (incluindo fontes remotas).

## Estrutura sugerida
```jsonc
{
  "title": "User Provisioning",
  "description": "Solicitação de criação de usuário",
  "version": 3,
  "fields": [
    {
      "key": "username",
      "label": "Login",
      "type": "text",                  // text | textarea | number | integer | date | datetime | select | multiselect | checkbox | radio | api_select
      "required": true,
      "default": null,
      "validation": {
        "pattern": "^[a-z0-9_.-]{4,30}$",
        "customMessage": "Use apenas a-z, 0-9, ._- (4-30)"
      },
      "ui": {                            // hints de UI opcionais
        "placeholder": "jdoe",
        "icon": "user",
        "cols": 6
      }
    },
    {
      "key": "role",
      "label": "Perfil",
      "type": "select",
      "required": true,
      "options": {
        "values": [
          { "label": "Padrão", "value": "standard" },
          { "label": "Admin", "value": "admin" }
        ]
      },
      "ui": { "cols": 6 }
    },
    {
      "key": "manager",
      "label": "Gestor",
      "type": "api_select",
      "required": true,
      "options": {
        "dataSource": {                 // apenas descreve; chamada HTTP ocorre no frontend
          "type": "rest",
          "url": "https://api.acme.com/users?role=manager",
          "method": "GET",
          "valuePath": "$.items[*].id",
          "labelPath": "$.items[*].displayName"
        }
      },
      "visibility": {                   // condicional simples
        "if": { "field": "role", "operator": "equals", "value": "admin" }
      },
      "ui": { "cols": 12, "loadingText": "Buscando gestores..." }
    }
  ],
  "layout": [                           // opcional; grid simples
    [ "username", "role" ],
    [ "manager" ]
  ]
}
```

## Campos e semântica
- `title`, `description`, `version`: metadados do formulário.
- `fields`: array de definições.
  - `key`: identificador único do campo.
  - `label`: rótulo exibido.
  - `type`: tipo lógico (text, textarea, number, integer, date, datetime, select, multiselect, checkbox, radio, api_select).
  - `required`: se o campo é obrigatório.
  - `default`: valor inicial (opcional).
  - `validation`: restrições opcionais (pattern, minLength, maxLength, min, max, customMessage).
  - `options`: para selects. Pode ser estático (`values`) ou remoto (`dataSource`).
    - `values`: lista de `{ label, value }`.
    - `dataSource`: descreve uma fonte REST. O fetch é feito pelo frontend (ou BFF), não pelo Forms API.
      - `url`, `method` (GET/POST...), `headers` (opcional), `valuePath`, `labelPath` (expressões para extrair itens).
  - `visibility`: condição simples para exibir/ocultar. Ex.: `{ if: { field, operator: equals|notEquals|in|notIn|gt|lt, value } }`.
  - `ui`: dicas de apresentação (cols, placeholder, icon, widget props). Renderer decide o que suportar.
- `layout`: opcional; define ordem e grid. Se ausente, usar ordem do array `fields`.

## Considerações
- Tudo fica em `SchemaJson` (JSONB no banco). Não usamos `UiSchema` ou `Rules` separados.
- Operações externas (dataSource REST) são executadas no frontend/BFF; o backend de Forms apenas armazena a definição.
- Para consistência, manter `version` aqui alinhado ao `FormDefinition.Version` (entidade). Atualize ambos ao versionar.

## Roadmap futuro (se precisar)
- Adicionar `UpdatedAtUtc` e `PublishedAtUtc` na entidade para auditoria.
- Expandir operadores de `visibility` ou permitir expressões mais ricas se o renderer suportar.
