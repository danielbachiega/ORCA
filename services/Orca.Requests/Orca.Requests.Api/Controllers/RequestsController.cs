using Microsoft.AspNetCore.Mvc;
using Orca.Requests.Application.Requests;

namespace Orca.Requests.Api.Controllers;

[ApiController]
[Route("api/requests")]
public class RequestsController : ControllerBase
{
    private readonly IRequestService _service;

    public RequestsController(IRequestService service)
    {
        _service = service ?? throw new ArgumentNullException(nameof(service));
    }

    /// <summary>
    /// Obtém todas as requisições
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<RequestSummaryDto>>> GetAll()
    {
        var requests = await _service.GetAllAsync();
        return Ok(requests);
    }

    /// <summary>
    /// Obtém requisições de um usuário para uma oferta específica
    /// </summary>
    [HttpGet("user/{userId}/offer/{offerId}")]
    public async Task<ActionResult<IEnumerable<RequestSummaryDto>>> GetByUserAndOffer(string userId, Guid offerId)
    {
        var requests = await _service.GetByUserAndOfferAsync(userId, offerId);
        return Ok(requests);
    }
    
    /// <summary>
    /// Obtém uma requisição por ID
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<RequestDetailsDto>> GetById(Guid id)
    {
        var request = await _service.GetByIdAsync(id);
        if (request == null)
            return NotFound($"Requisição com ID {id} não encontrada");

        return Ok(request);
    }

    /// <summary>
    /// Obtém requisições por Offer ID
    /// </summary>
    [HttpGet("offer/{offerId}")]
    public async Task<ActionResult<IEnumerable<RequestSummaryDto>>> GetByOfferId(Guid offerId)
    {
        var requests = await _service.GetByOfferIdAsync(offerId);
        return Ok(requests);
    }

    /// <summary>
    /// Obtém requisições por User ID
    /// </summary>
    [HttpGet("user/{userId}")]
    public async Task<ActionResult<IEnumerable<RequestSummaryDto>>> GetByUserId(string userId)
    {
        var requests = await _service.GetByUserIdAsync(userId);
        return Ok(requests);
    }

    /// <summary>
    /// Cria uma nova requisição
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<RequestDetailsDto>> Create([FromBody] CreateRequestDto dto)
    {
        var created = await _service.CreateAsync(dto);
        return CreatedAtAction(nameof(GetById), new { id = created.Id }, created);
    }

    /// <summary>
    /// Atualiza uma requisição existente
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<RequestDetailsDto>> Update(Guid id, [FromBody] UpdateRequestDto dto)
    {
        if (id != dto.Id)
            return BadRequest("ID da URL não corresponde ao ID do corpo da requisição");

        var updated = await _service.UpdateAsync(dto);
        return Ok(updated);
    }

    /// <summary>
    /// Deleta uma requisição
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(Guid id)
    {
        await _service.DeleteAsync(id);
        return NoContent();
    }
}