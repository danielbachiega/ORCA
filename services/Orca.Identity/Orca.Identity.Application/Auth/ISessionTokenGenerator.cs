namespace Orca.Identity.Application.Auth;

public interface ISessionTokenGenerator
{
    /// <summary>
    /// Gera JWT de sessão com claims do usuário
    /// </summary>
    string GenerateToken(Guid userId, string username, List<string> roles, int expiresInMinutes = 60);
}