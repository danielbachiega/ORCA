using Microsoft.AspNetCore.Mvc;
using Orca.Identity.Application.Auth;

namespace Orca.Identity.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly IAuthService _authService;
    private readonly ILogger<AuthController> _logger;

    public AuthController(IAuthService authService, ILogger<AuthController> logger)
    {
        _authService = authService;
        _logger = logger;
    }

    /// <summary>
    /// Login com token OIDC
    /// </summary>
    [HttpPost("login")]
    public async Task<ActionResult<LoginResponseDto>> Login([FromBody] LoginRequestDto request)
    {
            var response = await _authService.LoginAsync(request);
            return Ok(response);
    }

    /// <summary>
    /// Retorna informações do usuário autenticado
    /// </summary>
    [HttpGet("me")]
    public async Task<ActionResult<UserInfoDto>> GetCurrentUser([FromQuery] Guid userId)
    {
            var user = await _authService.GetCurrentUserAsync(userId);
            return Ok(user);
        
    }

    /// <summary>
    /// Logout (por enquanto apenas marca no servidor)
    /// </summary>
    [HttpPost("logout")]
    public async Task<ActionResult<LogoutResponseDto>> Logout([FromBody] Guid userId)
    {
            await _authService.LogoutAsync(userId);
            return Ok(new LogoutResponseDto(true, "Logout realizado com sucesso"));
    }
}