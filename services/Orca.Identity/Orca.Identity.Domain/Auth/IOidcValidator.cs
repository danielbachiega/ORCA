namespace Orca.Identity.Domain.Auth;

public record OidcClaims(
    string Username,
    string Email,
    string Subject  // sub (ID único do provedor)
);

public interface IOidcValidator
{
    /// <summary>
    /// Valida e extrai claims de um token OIDC
    /// </summary>
    /// <param name="idToken">Token JWT enviado pelo frontend</param>
    /// <returns>Claims extraídos ou null se inválido</returns>
    Task<OidcClaims?> ValidateTokenAsync(string idToken);
}