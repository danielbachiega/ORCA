using Microsoft.AspNetCore.Mvc;
using Orca.Catalog.Application.Offers;

namespace Orca.Catalog.Api.Controllers;

[ApiController]
[Route("api/offers")]
public class OffersController : ControllerBase
{
    private readonly IOfferService _service;

    public OffersController(IOfferService service)
    {
        _service = service ?? throw new ArgumentNullException(nameof(service));
    }

    /// <summary>
    /// Obtém todas as offers
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<OfferSummaryDto>>> GetAll()
    {
        var offers = await _service.GetAllAsync();
        return Ok(offers);
    }

    /// <summary>
    /// Obtém offers visíveis para as roles fornecidas
    /// </summary>
    [HttpGet("by-roles")]
    public async Task<ActionResult<IEnumerable<OfferSummaryDto>>> GetByRoles([FromQuery] string[] roles)
    {
        if (roles == null || roles.Length == 0)
            return BadRequest(new { error = "Pelo menos uma role deve ser fornecida" });

        var offers = await _service.GetByRolesAsync(roles);
        return Ok(offers);
    }
    
    /// <summary>
    /// Obtém uma offer por ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<OfferDetailsDto>> GetById(Guid id)
    {
        var offer = await _service.GetByIdAsync(id);
        if (offer == null)
            return NotFound(new { error = $"Offer com ID {id} não encontrada" });

        return Ok(offer);
    }

    /// <summary>
    /// Obtém uma offer por Slug
    /// </summary>
    [HttpGet("slug/{slug}")]
    public async Task<ActionResult<OfferDetailsDto>> GetBySlug(string slug)
    {
        var offer = await _service.GetBySlugAsync(slug);
        if (offer == null)
            return NotFound(new { error = $"Offer com Slug '{slug}' não encontrada" });

        return Ok(offer);
    }

    /// <summary>
    /// Cria uma nova offer
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<OfferDetailsDto>> Create([FromBody] CreateOfferDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var created = await _service.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Atualiza uma offer existente
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<OfferDetailsDto>> Update(Guid id, [FromBody] UpdateOfferDto dto)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (id != dto.Id)
            return BadRequest(new { error = "ID da URL não corresponde ao ID do corpo" });

        try
        {
            var updated = await _service.UpdateAsync(dto);
            return Ok(updated);
        }
        catch (InvalidOperationException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    /// <summary>
    /// Deleta uma offer
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        try
        {
            await _service.DeleteAsync(id);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(new { error = ex.Message });
        }
    }
}