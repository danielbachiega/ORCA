using Microsoft.AspNetCore.Mvc;
using Orca.Catalog.Domain.Entities;
using Orca.Catalog.Domain.Repositories;
using Orca.Catalog.Application.FormDefinitions;

namespace Orca.Catalog.Api.Controllers;

[ApiController]
[Route("api/form-definitions")]
public class FormDefinitionsController : ControllerBase
{
    private readonly IFormDefinitionRepository _repository;

    public FormDefinitionsController(IFormDefinitionRepository repository)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
    }

    /// <summary>
    /// Obtém todas as form definitions
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<FormDefinition>>> GetAll()
    {
        var formDefinitions = await _repository.GetAllAsync();
        return Ok(formDefinitions);
    }

    /// <summary>
    /// Obtém uma form definition por ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<FormDefinition>> GetById(Guid id)
    {
        var formDefinition = await _repository.GetByIdAsync(id);
        if (formDefinition == null)
            return NotFound($"FormDefinition com ID {id} não encontrada");

        return Ok(formDefinition);
    }

    /// <summary>
    /// Obtém form definitions por Offer ID
    /// </summary>
    [HttpGet("offer/{offerId}")]
    public async Task<ActionResult<IEnumerable<FormDefinition>>> GetByOfferId(Guid offerId)
    {
        var formDefinitions = await _repository.GetByOfferIdAsync(offerId);
        return Ok(formDefinitions);
    }

    /// <summary>
    /// Cria uma nova form definition
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<FormDefinition>> Create([FromBody] CreateFormDefinitionDto dto)
    {
        try
        {
            var formDefinition = new FormDefinition
            {
                OfferId = dto.OfferId,
                Version = dto.Version,
                JsonSchema = dto.JsonSchema,
                UiSchema = dto.UiSchema,
                Rules = dto.Rules,
                IsPublished = dto.IsPublished
            };

            var createdFormDefinition = await _repository.CreateAsync(formDefinition);
            return CreatedAtAction(nameof(GetById), new { id = createdFormDefinition.Id }, createdFormDefinition);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Atualiza uma form definition existente
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<FormDefinition>> Update(Guid id, [FromBody] UpdateFormDefinitionDto dto)
    {
        if (id != dto.Id)
            return BadRequest("ID da URL não corresponde ao ID do corpo");

        try
        {
            var formDefinition = new FormDefinition
            {
                Id = dto.Id,
                OfferId = dto.OfferId,
                Version = dto.Version,
                JsonSchema = dto.JsonSchema,
                UiSchema = dto.UiSchema,
                Rules = dto.Rules,
                IsPublished = dto.IsPublished
            };

            var updatedFormDefinition = await _repository.UpdateAsync(formDefinition);
            return Ok(updatedFormDefinition);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Deleta uma form definition
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

    /// <summary>
    /// Publica uma form definition (desativa a anterior)
    /// </summary>
    [HttpPost("{id}/publish")]
    public async Task<IActionResult> Publish(Guid id)
    {
        try
        {
            await _repository.PublishAsync(id);
            return Ok();
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ex.Message);
        }
    }
}
