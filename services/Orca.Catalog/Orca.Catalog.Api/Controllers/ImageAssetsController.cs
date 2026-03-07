using Microsoft.AspNetCore.Mvc;
using Orca.Catalog.Application.ImageAssets;

namespace Orca.Catalog.Api.Controllers;

[ApiController]
[Route("api/image-assets")]
public class ImageAssetsController : ControllerBase
{
    private readonly IImageAssetService _service;
    private readonly IImageAssetStorage _storage;

    public ImageAssetsController(IImageAssetService service, IImageAssetStorage storage)
    {
        _service = service ?? throw new ArgumentNullException(nameof(service));
        _storage = storage ?? throw new ArgumentNullException(nameof(storage));
    }

   public class UploadImageAssetRequest
    {
        public string Slug { get; set; } = string.Empty;
        public string Name { get; set; } = string.Empty;
        public IFormFile File { get; set; } = default!;
    }

   [HttpPost("upload")]
    [RequestSizeLimit(1_048_576)]
    public async Task<ActionResult<ImageAssetDto>> Upload([FromForm] UploadImageAssetRequest request, CancellationToken ct)
    {
        if (request.File == null || request.File.Length == 0)
            return BadRequest(new { error = "Arquivo obrigatorio." });

        var allowed = new[] { "image/png", "image/jpeg" };
        if (!allowed.Contains(request.File.ContentType))
            return BadRequest(new { error = "Somente PNG ou JPG." });

        if (request.File.Length > 1_048_576)
            return BadRequest(new { error = "Arquivo deve ter no maximo 1MB." });

        if (string.IsNullOrWhiteSpace(request.Slug))
            return BadRequest(new { error = "Slug obrigatorio." });

        var stored = await _storage.SaveAsync(
            request.File.OpenReadStream(),
            request.File.FileName,
            request.File.ContentType,
            ct);

        var created = await _service.CreateAsync(new CreateImageAssetDto
        {
            Slug = request.Slug,
            Name = string.IsNullOrWhiteSpace(request.Name) ? request.Slug : request.Name,
            Url = stored.Url,
            ContentType = stored.ContentType,
            SizeBytes = stored.SizeBytes
        });

        return CreatedAtAction(nameof(GetBySlug), new { slug = created.Slug }, created);
    }

    [HttpGet]
    public async Task<ActionResult<IEnumerable<ImageAssetDto>>> GetAll()
    {
        var assets = await _service.GetAllAsync();
        return Ok(assets);
    }

    [HttpGet("{slug}")]
    public async Task<ActionResult<ImageAssetDto>> GetBySlug(string slug)
    {
        var asset = await _service.GetBySlugAsync(slug);
        if (asset == null)
            return NotFound(new { error = $"ImageAsset com slug '{slug}' não encontrado" });

        return Ok(asset);
    }

    [HttpDelete("{slug}")]
    public async Task<IActionResult> Delete(string slug, CancellationToken ct)
    {
        var deleted = await _service.DeleteAsync(slug);
        if (deleted == null)
            return NotFound(new { error = $"ImageAsset com slug '{slug}' não encontrado" });

        await _storage.DeleteAsync(deleted.Url, ct);
        return NoContent();
    }
}