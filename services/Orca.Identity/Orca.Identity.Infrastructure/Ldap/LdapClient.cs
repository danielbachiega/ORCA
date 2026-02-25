using Orca.Identity.Domain.Ldap;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using System.DirectoryServices.Protocols;
using System.Net;

namespace Orca.Identity.Infrastructure.Ldap;

public class LdapClient : ILdapClient
{
    private readonly ILogger<LdapClient> _logger;
    private readonly LdapSettings _settings;

    public LdapClient(
        ILogger<LdapClient> logger,
        IOptions<LdapSettings> settings)
    {
        _logger = logger;
        _settings = settings.Value;

        if (!_settings.IsValid())
        {
            _logger.LogWarning("⚠️ Configurações LDAP inválidas. Usando modo MOCK.");
            _settings.UseMockMode = true;
        }

        _logger.LogInformation(
            "LdapClient inicializado - Modo: {Mode} | Host: {Host} | Port: {Port}",
            _settings.UseMockMode ? "MOCK" : "REAL",
            _settings.Host ?? "N/A",
            _settings.Port
        );
    }

    public async Task<bool> ValidateCredentialsAsync(string username, string password)
    {
        if (IsLocalUserConfigured(username))
        {
            return TryValidateLocalUser(username, password);
        }

        if (_settings.UseMockMode)
        {
            return await ValidateCredentialsMockAsync(username, password);
        }

        return await ValidateCredentialsRealAsync(username, password);
    }

    private async Task<bool> ValidateCredentialsMockAsync(string username, string password)
    {
        _logger.LogInformation("🧪 [MOCK] Validando credenciais para: {Username}", username);

        await Task.Delay(50); // Simula latência de LDAP

        // Mock: apenas credenciais EXPLICITAMENTE definidas são válidas
        var isValid = (username, password) switch
        {
            // Usuários administrativos
            ("superadmin", "Orca@2026") => true,
            ("admin", "admin123") => true,
            
            // Usuários de teste por tipo de role
            ("editor", "editor123") => true,
            ("consumer", "consumer123") => true,
            
            // Usuários de exemplo por departamento
            ("daniel.bachiega", "senha123") => true,
            ("joao.silva", "senha123") => true,
            ("maria.santos", "senha123") => true,
            ("pedro.lima", "senha123") => true,
            
            _ => false
        };

        if (isValid)
        {
            _logger.LogInformation("✅ [MOCK] Credenciais válidas para: {Username}", username);
        }
        else
        {
            _logger.LogWarning("❌ [MOCK] Credenciais inválidas para: {Username}", username);
        }

        return isValid;
    }

    private async Task<bool> ValidateCredentialsRealAsync(string username, string password)
    {
        _logger.LogInformation("🔐 [REAL] Validando credenciais LDAP para: {Username}", username);

        try
        {
            using var connection = new LdapConnection(
                new LdapDirectoryIdentifier(_settings.Host, _settings.Port)
            );

            connection.AuthType = AuthType.Basic;
            connection.SessionOptions.ProtocolVersion = 3;
            connection.Timeout = TimeSpan.FromSeconds(_settings.TimeoutSeconds);

            // Configurar SSL/TLS se necessário
            if (_settings.UseSsl)
            {
                connection.SessionOptions.SecureSocketLayer = true;
                connection.SessionOptions.VerifyServerCertificate = (conn, cert) => true; // ⚠️ Em produção: validar certificado
            }

            // Montar identidade do usuário para bind (Simple Bind)
            string userDn;
            if (!string.IsNullOrWhiteSpace(_settings.Domain))
            {
                // Usar formato DOMAIN\username para Active Directory
                userDn = $"{_settings.Domain}\\{username}";
            }
            else
            {
                // Fallback para DN usando BaseDn se Domain não for configurado
                userDn = $"{_settings.UsernameAttribute}={username},{_settings.BaseDn}";
            }

            _logger.LogDebug("Tentando bind LDAP com DN: {UserDn}", userDn);

            // Tentar bind (autenticação)
            var credential = new NetworkCredential(userDn, password);
            connection.Bind(credential);

            _logger.LogInformation("✅ [REAL] Credenciais LDAP válidas para: {Username}", username);
            return await Task.FromResult(true);
        }
        catch (LdapException ex)
        {
            _logger.LogWarning(ex, "❌ [REAL] Erro LDAP ao validar credenciais para {Username}: {Message}", 
                username, ex.Message);
            return await Task.FromResult(false);
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ [REAL] Erro inesperado ao validar credenciais para {Username}", username);
            return await Task.FromResult(false);
        }
    }

    public async Task<List<string>> GetUserGroupsAsync(string username)
    {
        if (IsLocalUserConfigured(username))
        {
            // Fallback local: usuários administrativos sempre recebem grupo "Admins"
            return await Task.FromResult(new List<string> { "Admins" });
        }

        if (_settings.UseMockMode)
        {
            return await GetUserGroupsMockAsync(username);
        }

        return await GetUserGroupsRealAsync(username);
    }

    private async Task<List<string>> GetUserGroupsMockAsync(string username)
    {
        _logger.LogInformation("🧪 [MOCK] Buscando grupos para: {Username}", username);

        await Task.Delay(100); // Simula latência

        var mockGroups = username switch
        {
            "superadmin" => new List<string> { "Admins", "TI" },
            "admin" => new List<string> { "Admins", "TI", "Developers" },
            "editor" => new List<string> { "Editors", "Developers" },
            "consumer" => new List<string> { "Users" },
            "daniel.bachiega" => new List<string> { "TI", "Admins", "Developers" },
            "joao.silva" => new List<string> { "TI", "Developers" },
            "maria.santos" => new List<string> { "Vendas", "Users" },
            "pedro.lima" => new List<string> { "RH", "Users" },
            _ => new List<string> { "Users" }
        };

        _logger.LogInformation("✅ [MOCK] Grupos encontrados para {Username}: [{Groups}]", 
            username, string.Join(", ", mockGroups));

        return mockGroups;
    }

    private bool IsLocalUserConfigured(string username)
    {
        if (string.IsNullOrWhiteSpace(username)) return false;

        if (username.Equals("superadmin", StringComparison.OrdinalIgnoreCase))
        {
            return !string.IsNullOrWhiteSpace(_settings.LocalSuperAdminPassword);
        }

        if (username.Equals("admin", StringComparison.OrdinalIgnoreCase))
        {
            return !string.IsNullOrWhiteSpace(_settings.LocalAdminPassword);
        }

        return false;
    }

    private bool TryValidateLocalUser(string username, string password)
    {
        if (string.IsNullOrWhiteSpace(username)) return false;

        if (username.Equals("superadmin", StringComparison.OrdinalIgnoreCase))
        {
            if (!string.IsNullOrWhiteSpace(_settings.LocalSuperAdminPassword) &&
                _settings.LocalSuperAdminPassword == password)
            {
                _logger.LogInformation("✅ [LOCAL] Credenciais válidas para: {Username}", username);
                return true;
            }
        }

        if (username.Equals("admin", StringComparison.OrdinalIgnoreCase))
        {
            if (!string.IsNullOrWhiteSpace(_settings.LocalAdminPassword) &&
                _settings.LocalAdminPassword == password)
            {
                _logger.LogInformation("✅ [LOCAL] Credenciais válidas para: {Username}", username);
                return true;
            }
        }

        return false;
    }

    private async Task<List<string>> GetUserGroupsRealAsync(string username)
    {
        _logger.LogInformation("🔐 [REAL] Buscando grupos LDAP para: {Username}", username);

        var groups = new List<string>();

        try
        {
            using var connection = new LdapConnection(
                new LdapDirectoryIdentifier(_settings.Host, _settings.Port)
            );

            connection.AuthType = AuthType.Basic;
            connection.SessionOptions.ProtocolVersion = 3;
            connection.Timeout = TimeSpan.FromSeconds(_settings.TimeoutSeconds);

            if (_settings.UseSsl)
            {
                connection.SessionOptions.SecureSocketLayer = true;
                connection.SessionOptions.VerifyServerCertificate = (conn, cert) => true;
            }

            // Bind com service account (recomendado) ou anônimo (se permitido)
            if (!string.IsNullOrWhiteSpace(_settings.ServiceAccountDn) &&
                !string.IsNullOrWhiteSpace(_settings.ServiceAccountPassword))
            {
                // Construir DN do service account automaticamente se for apenas um username
                string serviceAccountDn = _settings.ServiceAccountDn;
                if (!string.IsNullOrWhiteSpace(_settings.Domain) && !_settings.ServiceAccountDn.Contains("=") && !_settings.ServiceAccountDn.Contains("\\"))
                {
                    // Se não contém "=" (CN=...) e não contém "\", assume que é apenas username
                    serviceAccountDn = $"{_settings.Domain}\\{_settings.ServiceAccountDn}";
                }
                
                _logger.LogDebug("Usando service account para consulta LDAP: {ServiceAccountDn}", serviceAccountDn);
                connection.Bind(new NetworkCredential(serviceAccountDn, _settings.ServiceAccountPassword));
            }
            else
            {
                _logger.LogWarning("Service account não configurada. Tentando bind anônimo (pode falhar em produção).");
                connection.Bind();
            }

            // Montar filtro de busca
            string searchFilter = $"({_settings.UsernameAttribute}={username})";
            var searchRequest = new SearchRequest(
                _settings.BaseDn,
                searchFilter,
                SearchScope.Subtree,
                _settings.GroupAttribute
            );

            var searchResponse = (SearchResponse)connection.SendRequest(searchRequest);

            if (searchResponse.Entries.Count > 0)
            {
                var entry = searchResponse.Entries[0];
                
                if (entry.Attributes.Contains(_settings.GroupAttribute))
                {
                    var groupAttribute = entry.Attributes[_settings.GroupAttribute];
                    
                    foreach (var groupDn in groupAttribute.GetValues(typeof(string)))
                    {
                        // Extrair apenas o nome do grupo do DN
                        // Exemplo: "CN=Admins,OU=Groups,DC=empresa,DC=com" -> "Admins"
                        string groupDnStr = groupDn?.ToString() ?? string.Empty;
                        var cnMatch = System.Text.RegularExpressions.Regex.Match(groupDnStr, @"CN=([^,]+)");
                        
                        if (cnMatch.Success)
                        {
                            groups.Add(cnMatch.Groups[1].Value);
                        }
                    }
                }
            }

            _logger.LogInformation("✅ [REAL] Grupos LDAP encontrados para {Username}: [{Groups}]", 
                username, string.Join(", ", groups));
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "❌ [REAL] Erro ao buscar grupos LDAP para {Username}", username);
            // Retornar grupo padrão em caso de erro
            groups.Add("Users");
        }

        return await Task.FromResult(groups);
    }
}