using Microsoft.AspNetCore.Mvc;
using Orca.Catalog.Domain.Entities;
using Orca.Catalog.Domain.Repositories;

namespace Orca.Catalog.Api.Controllers;

[ApiController]
[Route("api/offers")]
public class OffersController : ControllerBase
{
    private readonly IOfferRepository _repository;

    public OffersController(IOfferRepository repository)
    {
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
    }

    /// <summary>
    /// Obtém todas as offers
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<Offer>>> GetAll()
    {
        var offers = await _repository.GetAllAsync();
        return Ok(offers);
    }

    /// <summary>
    /// Obtém uma offer por ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<Offer>> GetById(Guid id)
    {
        var offer = await _repository.GetByIdAsync(id);
        if (offer == null)
            return NotFound($"Offer com ID {id} não encontrada");

        return Ok(offer);
    }

    /// <summary>
    /// Obtém uma offer por Slug
    /// </summary>
    [HttpGet("slug/{slug}")]
    public async Task<ActionResult<Offer>> GetBySlug(string slug)
    {
        var offer = await _repository.GetBySlugAsync(slug);
        if (offer == null)
            return NotFound($"Offer com Slug '{slug}' não encontrada");

        return Ok(offer);
    }

    /// <summary>
    /// Cria uma nova offer
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<Offer>> Create([FromBody] Offer offer)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        try
        {
            var createdOffer = await _repository.CreateAsync(offer);
            return CreatedAtAction(nameof(GetById), new { id = createdOffer.Id }, createdOffer);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
        }
    }

    /// <summary>
    /// Atualiza uma offer existente
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<Offer>> Update(Guid id, [FromBody] Offer offer)
    {
        if (!ModelState.IsValid)
            return BadRequest(ModelState);

        if (id != offer.Id)
            return BadRequest("ID da URL não corresponde ao ID do corpo");

        try
        {
            var updatedOffer = await _repository.UpdateAsync(offer);
            return Ok(updatedOffer);
        }
        catch (InvalidOperationException ex)
        {
            return BadRequest(ex.Message);
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
            await _repository.DeleteAsync(id);
            return NoContent();
        }
        catch (InvalidOperationException ex)
        {
            return NotFound(ex.Message);
        }
    }
}