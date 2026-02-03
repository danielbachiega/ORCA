using Microsoft.AspNetCore.Mvc;
using Orca.Forms.Application.ExecutionTemplates;

namespace Orca.Forms.Api.Controllers;

[ApiController]
[Route("api/execution-templates")]
public class ExecutionTemplatesController : ControllerBase
{
    private readonly IExecutionTemplateService _service;

    public ExecutionTemplatesController(IExecutionTemplateService service)
    {
        _service = service ?? throw new ArgumentNullException(nameof(service));
    }

    /// <summary>
    /// Obtém todos os execution templates
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ExecutionTemplateSummaryDto>>> GetAll()
    {
        var templates = await _service.GetAllAsync();
        return Ok(templates);
    }

    /// <summary>
    /// Obtém um execution template por ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ExecutionTemplateDetailsDto>> GetById(Guid id)
    {
        var template = await _service.GetByIdAsync(id);
        if (template == null)
            return NotFound($"ExecutionTemplate com ID {id} não encontrado");

        return Ok(template);
    }

    /// <summary>
    /// Obtém execution template por FormDefinitionId
    /// </summary>
    [HttpGet("form-definition/{formDefinitionId}")]
    public async Task<ActionResult<ExecutionTemplateDetailsDto>> GetByFormDefinitionId(Guid formDefinitionId)
    {
        var template = await _service.GetByFormDefinitionIdAsync(formDefinitionId);
        if (template == null)
            return NotFound($"ExecutionTemplate para FormDefinition {formDefinitionId} não encontrado");

        return Ok(template);
    }

    /// <summary>
    /// Cria um novo execution template
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ExecutionTemplateDetailsDto>> Create([FromBody] CreateExecutionTemplateDto dto)
    {
        var created = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>
    /// Atualiza um execution template existente
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ExecutionTemplateDetailsDto>> Update(Guid id, [FromBody] UpdateExecutionTemplateDto dto)
    {
        if (id != dto.Id)
            return BadRequest("ID da URL não corresponde ao ID do corpo");

        var updated = await _service.UpdateAsync(dto);
        return Ok(updated);
    }

    /// <summary>
    /// Deleta um execution template
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _service.DeleteAsync(id);
        return NoContent();
    }
}