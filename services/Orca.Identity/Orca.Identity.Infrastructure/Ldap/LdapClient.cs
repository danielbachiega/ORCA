using Orca.Identity.Domain.Ldap;
using Microsoft.Extensions.Logging;

namespace Orca.Identity.Infrastructure.Ldap;

public class LdapClient : ILdapClient
{
    private readonly ILogger<LdapClient> _logger;

    public LdapClient(ILogger<LdapClient> logger)
    {
        _logger = logger;
    }

    public async Task<bool> ValidateCredentialsAsync(string username, string password)
    {
        // ⚠️ MOCK: Em produção, validar via LDAP.DirectoryServices
        // Por enquanto: credenciais mock para testes

        _logger.LogInformation("Validando credenciais LDAP para usuário: {Username}", username);

        await Task.Delay(50); // Simula latência de LDAP

        // Mock: credenciais predefinidas para testes
        var isValid = (username, password) switch
        {
            ("superadmin", "Orca@2026") => true,  // Superadmin padrão
            ("admin", "admin123") => true,        // Admin de teste
            ("editor", "editor123") => true,      // Editor de teste
            ("consumer", "consumer123") => true,  // Consumer de teste
            _ => !string.IsNullOrWhiteSpace(username) && !string.IsNullOrWhiteSpace(password) // Fallback: aceita qualquer
        };

        if (isValid)
        {
            _logger.LogInformation("Credenciais válidas para usuário: {Username}", username);
        }
        else
        {
            _logger.LogWarning("Credenciais inválidas para usuário: {Username}", username);
        }

        return isValid;
    }

    public async Task<List<string>> GetUserGroupsAsync(string username)
    {
        // ⚠️ MOCK: Em produção, conectar via LDAP.DirectoryServices
        // Por enquanto: retorna grupos mock baseado no username

        _logger.LogInformation("Buscando grupos LDAP para usuário: {Username}", username);

        // Exemplo mock
        await Task.Delay(100); // Simula latência

        var mockGroups = username switch
        {
            "admin" => new List<string> { "Admins", "TI", "Developers" },
            "editor" => new List<string> { "Editors", "Developers" },
            "consumer" => new List<string> { "Users" },
            _ => new List<string> { "Users" }
        };

        _logger.LogInformation("Grupos LDAP encontrados para {Username}: {Groups}", 
            username, string.Join(", ", mockGroups));

        return mockGroups;
    }
}