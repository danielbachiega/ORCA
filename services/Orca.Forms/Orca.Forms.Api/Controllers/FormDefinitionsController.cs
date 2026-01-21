using Microsoft.AspNetCore.Mvc;
using Orca.Forms.Application.FormDefinitions;

namespace Orca.Forms.Api.Controllers;

[ApiController]
[Route("api/form-definitions")]
public class FormDefinitionsController : ControllerBase
{
    private readonly IFormDefinitionService _service;

    public FormDefinitionsController(IFormDefinitionService service)
    {
        _service = service ?? throw new ArgumentNullException(nameof(service));
    }

    /// <summary>
    /// Obtém todas as form definitions
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<FormDefinitionSummaryDto>>> GetAll()
    {
        var formDefinitions = await _service.GetAllAsync();
        return Ok(formDefinitions);
    }

    /// <summary>
    /// Obtém uma form definition por ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<FormDefinitionDetailsDto>> GetById(Guid id)
    {
        var formDefinition = await _service.GetByIdAsync(id);
        if (formDefinition == null)
            return NotFound($"FormDefinition com ID {id} não encontrada");

        return Ok(formDefinition);
    }

    /// <summary>
    /// Obtém form definitions por Offer ID
    /// </summary>
    [HttpGet("offer/{offerId}")]
    public async Task<ActionResult<IEnumerable<FormDefinitionSummaryDto>>> GetByOfferId(Guid offerId)
    {
        var formDefinitions = await _service.GetByOfferIdAsync(offerId);
        return Ok(formDefinitions);
    }

    /// <summary>
    /// Obtém a form definition publicada de uma oferta
    /// </summary>
    [HttpGet("offer/{offerId}/published")]
    public async Task<ActionResult<FormDefinitionDetailsDto>> GetPublishedByOfferId(Guid offerId)
    {
        var formDefinition = await _service.GetPublishedByOfferIdAsync(offerId);
        if (formDefinition == null)
            return NotFound($"Nenhuma FormDefinition publicada encontrada para a oferta {offerId}");

        return Ok(formDefinition);
    }

    /// <summary>
    /// Cria uma nova form definition
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<FormDefinitionDetailsDto>> Create([FromBody] CreateFormDefinitionDto dto)
    {
        var createdFormDefinition = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = createdFormDefinition.Id }, createdFormDefinition);
    }

    /// <summary>
    /// Atualiza uma form definition existente
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<FormDefinitionDetailsDto>> Update(Guid id, [FromBody] UpdateFormDefinitionDto dto)
    {
        if (id != dto.Id)
            return BadRequest("ID da URL não corresponde ao ID do corpo");

        var updatedFormDefinition = await _service.UpdateAsync(dto);
        return Ok(updatedFormDefinition);
    }

    /// <summary>
    /// Deleta uma form definition
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _service.DeleteAsync(id);
        return NoContent();
    }

    /// <summary>
    /// Publica uma form definition
    /// </summary>
    [HttpPost("{id}/publish")]
    public async Task<IActionResult> Publish(Guid id)
    {
        await _service.PublishAsync(id);
        return Ok(new { message = "FormDefinition publicada com sucesso" });
    }
}
