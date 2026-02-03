using System.IdentityModel.Tokens.Jwt;
using Orca.Identity.Domain.Auth;
using Microsoft.Extensions.Logging;


namespace Orca.Identity.Infrastructure.Auth;

public class OidcValidator : IOidcValidator
{
    private readonly ILogger<OidcValidator> _logger;

    public OidcValidator(ILogger<OidcValidator> logger)
    {
        _logger = logger;
    }

    public Task<OidcClaims?> ValidateTokenAsync(string idToken)
    {
        try
        {
            // ⚠️ MOCK: Em produção, validar com o provedor OIDC real
            // Por enquanto: apenas decodifica sem validar assinatura

            var handler = new JwtSecurityTokenHandler();
            var token = handler.ReadJwtToken(idToken);

            var username = token.Claims.FirstOrDefault(c => c.Type == "preferred_username")?.Value
                        ?? token.Claims.FirstOrDefault(c => c.Type == "name")?.Value
                        ?? throw new InvalidOperationException("Username não encontrado no token");

            var email = token.Claims.FirstOrDefault(c => c.Type == "email")?.Value
                     ?? throw new InvalidOperationException("Email não encontrado no token");

            var subject = token.Claims.FirstOrDefault(c => c.Type == "sub")?.Value
                       ?? throw new InvalidOperationException("Subject não encontrado no token");

            _logger.LogInformation("Token OIDC validado para usuário: {Username}", username);

            return Task.FromResult<OidcClaims?>(new OidcClaims(username, email, subject));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Erro ao validar token OIDC");
            return Task.FromResult<OidcClaims?>(null);
        }
    }
}