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