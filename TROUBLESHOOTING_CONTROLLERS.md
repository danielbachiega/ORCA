# Troubleshooting: Controllers não aparecem no Swagger

## Problema

Você criou um novo Controller em `Controllers/` com a rota correta, mas o endpoint **não aparece no Swagger** e retorna **404 Not Found** quando testado via HTTP.

Exemplo:
```bash
curl http://localhost:5001/api/form-definitions
# HTTP/1.1 404 Not Found
```

Mas ao mesmo tempo, outros controllers como `OffersController` funcionam normalmente.

## Causa Raiz

Existem várias causas possíveis. A mais comum é **detalhes no construtor do Controller**:

### ❌ ERRADO - Controller incompleto:
```csharp
public class FormDefinitionsController : ControllerBase
{
    private readonly IFormDefinitionRepository _repository;

    public FormDefinitionsController(IFormDefinitionRepository repository)
    {
        _repository = repository;  // ❌ Sem validação
    }
}
```

### ✅ CORRETO - Controller com validação:
```csharp
public class FormDefinitionsController : ControllerBase
{
    private readonly IFormDefinitionRepository _repository;

    public FormDefinitionsController(IFormDefinitionRepository repository)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));  // ✅ Com validação
    }
}
```

## Solução Passo-a-Passo

### 1. **Adicione validação null no construtor**
```csharp
public FormDefinitionsController(IFormDefinitionRepository repository)
{
    _repository = repository ?? throw new ArgumentNullException(nameof(repository));
}
```

### 2. **Use `[FromBody]` em POST/PUT**
```csharp
[HttpPost]
public async Task<ActionResult<FormDefinition>> Create([FromBody] FormDefinition formDefinition)
{
    if (!ModelState.IsValid)
        return BadRequest(ModelState);
    // ...
}

[HttpPut("{id}")]
public async Task<ActionResult<FormDefinition>> Update(Guid id, [FromBody] FormDefinition formDefinition)
{
    if (!ModelState.IsValid)
        return BadRequest(ModelState);
    // ...
}
```

### 3. **Valide ModelState**
```csharp
if (!ModelState.IsValid)
    return BadRequest(ModelState);
```

### 4. **Use try-catch para exceções de negócio**
```csharp
try
{
    var created = await _repository.CreateAsync(formDefinition);
    return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
}
catch (InvalidOperationException ex)
{
    return BadRequest(ex.Message);
}
```

### 5. **Adicione XML comments (summaries)**
```csharp
/// <summary>
/// Obtém todas as form definitions
/// </summary>
[HttpGet]
public async Task<ActionResult<IEnumerable<FormDefinition>>> GetAll()
{
    // ...
}
```

## Checklist para Novos Controllers

Sempre que criar um novo controller, verifique:

- [ ] Constructor tem `?? throw new ArgumentNullException(nameof(repository))`
- [ ] POST/PUT têm `[FromBody]` nos parâmetros
- [ ] POST/PUT validam `ModelState.IsValid`
- [ ] POST/PUT têm try-catch para `InvalidOperationException`
- [ ] Métodos têm XML comments com `/// <summary>`
- [ ] Namespace usa `file-scoped` com `;` e não braces `{}`
- [ ] Interface do repository está em `Domain/Repositories/`, não em `Infrastructure/Repositories/`
- [ ] A interface é registrada em `ServiceCollectionExtensions.cs`

## Template Recomendado

Sempre copie a estrutura do `OffersController` como template para novos controllers:

```csharp
using Microsoft.AspNetCore.Mvc;
using Orca.Catalog.Domain.Entities;
using Orca.Catalog.Domain.Repositories;

namespace Orca.Catalog.Api.Controllers;

[ApiController]
[Route("api/seu-recurso")]
public class SeuResourceController : ControllerBase
{
    private readonly ISeuResourceRepository _repository;

    public SeuResourceController(ISeuResourceRepository repository)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
    }

    /// <summary>
    /// Obtém todos os recursos
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<SeuResource>>> GetAll()
    {
        var recursos = await _repository.GetAllAsync();
        return Ok(recursos);
    }

    /// <summary>
    /// Obtém um recurso por ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<SeuResource>> GetById(Guid id)
    {
        var recurso = await _repository.GetByIdAsync(id);
        if (recurso == null)
            return NotFound($"Recurso com ID {id} não encontrado");

        return Ok(recurso);
    }

    /// <summary>
    /// Cria um novo recurso
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<SeuResource>> Create([FromBody] SeuResource recurso)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var created = await _repository.CreateAsync(recurso);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Atualiza um recurso existente
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<SeuResource>> Update(Guid id, [FromBody] SeuResource recurso)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (id != recurso.Id)
            return BadRequest("ID da URL não corresponde ao ID do corpo");

        try
        {
            var updated = await _repository.UpdateAsync(recurso);
            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Deleta um recurso
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            await _repository.DeleteAsync(id);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ex.Message);
        }
    }
}
```

## Debug Rápido

Se um novo controller não aparece no Swagger:

1. Verifique os logs: `podman logs orca-catalog-api | grep -i error`
2. Teste HTTP direto: `curl http://localhost:5001/api/seu-endpoint`
3. Compare com `OffersController` - procure diferenças
4. Procure pelo pattern `?? throw new ArgumentNullException` no construtor
5. Se nada funcionar, **delete e recrie o arquivo** copiando exatamente do template

## Estrutura Arquitetural Correta

```
Domain/Repositories/
  └── ISeuResourceRepository.cs      ← Interface aqui (não em Infrastructure!)
  
Domain/Entities/
  └── SeuResource.cs                 ← Entity aqui
  
Infrastructure/Repositories/
  └── SeuResourceRepository.cs        ← Implementação aqui
  
Api/Controllers/
  └── SeuResourcesController.cs       ← Controller aqui (plural!)
  
Infrastructure/Extensions/
  └── ServiceCollectionExtensions.cs  ← Registrar aqui
      services.AddScoped<ISeuResourceRepository, SeuResourceRepository>();
```

## Dica de Implementação

**Ao criar um novo controller, sempre use `create_file` do zero**, não múltiplos `replace_string_in_file`:

❌ EVITE:
```
1. create_file com código incompleto
2. replace_string_in_file para adicionar imports
3. replace_string_in_file para corrigir indentação
4. replace_string_in_file para adicionar métodos
5. ...arquivo fica "misteriosamente quebrado"
```

✅ FAÇA:
```
1. create_file com código COMPLETO de uma vez
   (ou delete e recrie com create_file do zero)
```

**Motivo**: Múltiplas edições com `replace_string_in_file` podem deixar o arquivo com caracteres invisíveis, problemas de encoding, ou inconsistências que impedem o ASP.NET de descobrir o controller.

Se um controller não funciona após várias edições, **delete e recrie com `create_file`** - é sempre mais rápido e seguro.

## Histórico de Ocorrências

- **OffersController**: Mesmo problema enfrentado, resolvido com template correto
- **FormDefinitionsController**: Mesmo problema, resolvido deletando e recriando com `create_file` do zero
