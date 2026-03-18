# 🖥️ ORCA — Plano do Módulo de Gerenciamento de VMs (MVP)

> Documento inicial de planejamento para implementação do módulo de VMs.
> Este arquivo está na raiz por conveniência e pode ser movido depois para o microserviço correspondente.

---

## 1) Objetivo do módulo

Adicionar ao ORCA a capacidade de:

- Registrar VMs provisionadas por automação (AWX) associadas ao solicitante
- Permitir operação da VM pelo usuário dono (consumer)
- Permitir visão/gestão global para admin
- Controlar ciclo de vida com expiração (lease/TTL) e prorrogação limitada
- Alertar o usuário quando faltarem 7 dias para expiração
- Remover automaticamente VM expirada via automação de remoção

---

## 2) Escopo funcional MVP

### Consumer

Pode:

- Ver apenas as próprias VMs
- Ligar VM
- Desligar VM
- Reiniciar VM
- Excluir VM
- Postergar expiração por 15 dias **apenas uma vez**

Não pode:

- Ver VMs de outros usuários
- Remover trava de expiração permanente

### Admin

Pode:

- Ver VMs de todos os usuários
- Executar as mesmas ações do consumer
- Remover trava de expiração (deixar VM sem expiração)

---

## 3) Fluxo funcional proposto

1. Admin publica oferta/formulário para criação de VM (já suportado no ORCA atual).
2. Consumer solicita a criação via fluxo existente (Requests + Orchestrator + AWX).
3. A automação AWX cria a VM.
4. Ao final da automação, AWX chama um endpoint do ORCA para registrar/atualizar o inventário da VM.
5. ORCA passa a exibir VM no dashboard de VMs do solicitante.
6. Ações operacionais (power on/off/reboot/delete/extend) são executadas via estratégia de integração definida.

---

## 4) Decisão de integração operacional (power/status)

Decisão fechada para o módulo:

- Integração com **VMware/vCenter já no MVP** para ações operacionais de VM
- Uso de automações **AWX** para notificações de expiração e remoção automática no vencimento

### Arquitetura de providers

- `IVmOperationsProvider` (abstração)
   - Implementação inicial: `VcenterVmOperationsProvider` (power on/off/reboot/status)
- `IVmLifecycleAutomationProvider` (abstração)
   - Implementação inicial: `AwxVmLifecycleAutomationProvider` (alertas e remoção por expiração)

Assim, o módulo separa operação de infraestrutura (VMware) do ciclo de comunicação/lifecycle (AWX).

---

## 5) Modelo de domínio inicial (sugestão)

### Entidade `VirtualMachine`

- `Id` (Guid)
- `VmExternalId` (string, id no provedor: VM UUID/MOID/etc)
- `Name` (string)
- `OperatingSystem` (string)
- `Cpu` (int)
- `MemoryMb` (int)
- `DiskGb` (int)
- `SpecsJson` (json opcional para metadados extras)
- `OwnerUserId` (string - login do solicitante)
- `OwnerDisplayName` (string opcional)
- `SourceRequestId` (Guid? - vínculo com request original)
- `Status` (enum interno: Unknown, PoweredOn, PoweredOff, Provisioning, Deleting, Error)
- `ExpiresAtUtc` (DateTime?)
- `ExpirationLocked` (bool)  // true = nunca expira
- `ExtensionUsed` (bool)     // controla prorrogação única de 15 dias
- `CreatedAtUtc` / `UpdatedAtUtc`
- `DeletedAtUtc` (soft delete opcional)

### Entidade `VmActionAudit`

- `Id` (Guid)
- `VmId` (Guid)
- `Action` (PowerOn, PowerOff, Reboot, Delete, Extend15Days, UnlockExpiration)
- `RequestedByUserId` (string)
- `Provider` (AWX/VCenter)
- `ProviderExecutionId` (string?)
- `Result` (Accepted, Success, Failed)
- `ErrorMessage` (string?)
- `CreatedAtUtc`

---

## 6) Contrato de integração AWX → ORCA (cadastro da VM)

### Endpoint técnico

`POST /api/vms/registrations`

Objetivo: endpoint para ser chamado ao final do job de criação de VM.

### Segurança recomendada

- Não usar token de usuário final
- Usar credencial técnica dedicada (ex.: API Key interna ou JWT service-to-service)
- Validar origem e aplicar rate limit

### Payload mínimo sugerido

```json
{
  "requestId": "GUID-opcional",
  "ownerUserId": "login.solicitante",
  "vmExternalId": "vm-12345",
  "name": "vm-login-solicitante",
  "operatingSystem": "Ubuntu 22.04",
  "cpu": 2,
  "memoryMb": 4096,
  "diskGb": 80,
  "expiresAtUtc": "2026-04-30T00:00:00Z",
  "specs": {
    "network": "VLAN-10",
    "environment": "dev"
  }
}
```

### Regras importantes

- Idempotência por (`vmExternalId`) e/ou (`requestId`)
- Se já existir VM com mesmo identificador externo, atualizar metadados ao invés de duplicar

---

## 7) API funcional do módulo (MVP)

## Endpoints para Consumer

- `GET /api/vms/me`
- `GET /api/vms/me/{vmId}`
- `POST /api/vms/{vmId}/power-on`
- `POST /api/vms/{vmId}/power-off`
- `POST /api/vms/{vmId}/reboot`
- `POST /api/vms/{vmId}/extend-15-days`
- `DELETE /api/vms/{vmId}`

## Endpoints para Admin

- `GET /api/vms` (filtro por owner, status, expiradas)
- `GET /api/vms/{vmId}`
- `POST /api/vms/{vmId}/power-on`
- `POST /api/vms/{vmId}/power-off`
- `POST /api/vms/{vmId}/reboot`
- `POST /api/vms/{vmId}/extend-15-days`
- `POST /api/vms/{vmId}/unlock-expiration`
- `DELETE /api/vms/{vmId}`

## Convenções

- Ações assíncronas retornam `202 Accepted` + `operationId`
- Operações síncronas simples podem retornar `200 OK`

---

## 8) Regras de negócio (MVP)

1. Consumer só opera VM própria.
2. Admin opera qualquer VM.
3. `extend-15-days` só pode ser executado uma vez por VM (`ExtensionUsed = true`).
4. `unlock-expiration` apenas Admin.
5. VM com `ExpirationLocked = true` ignora expiração automática.
6. Exclusão deve registrar auditoria.
7. Todas as ações devem gerar trilha em `VmActionAudit`.
8. Alertas de expiração devem ocorrer **uma única vez por marco**: D-7, D-3 e D-1.
9. Cada alerta deve ser disparado via automação AWX enviando: data de expiração, login do usuário e nome da VM.
10. Ao atingir `ExpiresAtUtc` (sem trava de expiração), o sistema deve acionar automação de remoção e excluir automaticamente a VM.
11. VMs com `ExpirationLocked = true` **não devem receber alertas de expiração** (D-7/D-3/D-1).

---

## 9) Alertas e expiração automática

Criar worker agendado (ex.: a cada 5 min):

- Busca VMs ativas com `ExpiresAtUtc` definido e `ExpirationLocked = false`
- Calcula janela de alerta e dispara AWX para marcos D-7, D-3 e D-1
- Garante idempotência por marco (cada alerta enviado apenas uma vez por VM)
- Não envia alertas para VMs com `ExpirationLocked = true`
- Payload do alerta para AWX: `expiresAtUtc`, `ownerUserId`, `vmName`
- Busca VMs com `ExpiresAtUtc <= now`, `ExpirationLocked = false`, não deletadas
- Executa obrigatoriamente automação AWX de remoção
- Marca VM como removida/deletada
- Registra auditoria

### Campos adicionais recomendados em `VirtualMachine`

- `Alert7DaysSentAtUtc` (DateTime?)
- `Alert3DaysSentAtUtc` (DateTime?)
- `Alert1DaySentAtUtc` (DateTime?)
- `DeletionRequestedAtUtc` (DateTime?)
- `DeletionExecutionId` (string?)

---

## 10) Observabilidade e operação

Métricas mínimas desde o MVP:

- Tempo p95/p99 de ações por tipo (`power-on`, `power-off`, etc.)
- Taxa de sucesso/erro por ação
- Quantidade de VMs ativas por usuário
- Quantidade de VMs expiradas pendentes de remoção

Logs estruturados com:

- `vmId`, `ownerUserId`, `action`, `provider`, `operationId`, `correlationId`

Canais de alerta:

- O ORCA delega a notificação para uma automação AWX específica
- O AWX decide o canal final (e-mail, chat, ITSM etc.), fora do escopo do ORCA

---

## 11) Segurança

- RBAC por role (`Consumer`, `Admin`)
- Validação estrita de ownership no backend (não confiar no frontend)
- Endpoint técnico de registro protegido por credencial de serviço
- Sanitização de campos livres (nome/metadata)

---

## 12) Plano de implementação sugerido

## Sprint 1 (MVP funcional)

1. Criar microserviço `Orca.Vms` (API + Application + Domain + Infrastructure)
2. Criar entidades/migrações (`VirtualMachine`, `VmActionAudit`)
3. Implementar endpoint técnico `POST /api/vms/registrations`
4. Implementar endpoints de leitura (`/me` e admin global)
5. Implementar ações operacionais via provider VMware/vCenter
6. Adicionar rotas no Gateway
7. Entregar tela web básica “Minhas VMs” + “VMs (Admin)”

## Sprint 2 (hardening)

1. Idempotência robusta e deduplicação
2. Observabilidade (métricas + logs)
3. Política de retry/backoff nas ações
4. Job de alertas D-7/D-3/D-1 via AWX com idempotência por marco
5. Job de expiração e deleção automática via automação AWX de remoção
6. Testes de autorização e regras de negócio

## Sprint 3 (evolução)

1. Melhorias de UX (status near real-time)
2. Otimizações de integração VMware (cache, fallback, circuit breaker)
3. Expansão de canais de notificação no AWX (se necessário)

---

## 13) Decisões em aberto (para fechar antes do código)

1. **Serviço novo vs estender Requests/Orchestrator?**
   - Recomendado: serviço novo (`Orca.Vms`) para manter bounded context claro.

2. **Modelo de exclusão:**
   - Recomendado: soft delete com campo `DeletedAtUtc` no início.

3. **Autenticação do endpoint de registro técnico:**
   - Recomendado: API Key interna no Gateway + rotação simples.

4. **Contrato técnico VMware:**
   - Definir credenciais, escopo de permissões e mapeamento de identificadores (`VmExternalId` ↔ VM object id no vCenter).

---

## 14) Próximo passo imediato

Fechar contrato do endpoint `POST /api/vms/registrations` e o schema da tabela `VirtualMachines`.

Com isso definido, já dá para iniciar o scaffold do microserviço e integrar no gateway sem retrabalho.
