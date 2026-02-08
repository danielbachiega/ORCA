namespace Orca.Identity.Infrastructure.Ldap;

/// <summary>
/// Configurações para conexão com LDAP/Active Directory
/// </summary>
public class LdapSettings
{
    /// <summary>
    /// Hostname ou IP do servidor LDAP/AD
    /// Exemplo: "ldap.empresa.com" ou "192.168.1.10"
    /// </summary>
    public string Host { get; set; } = string.Empty;

    /// <summary>
    /// Porta do servidor LDAP
    /// Padrão: 389 (LDAP) ou 636 (LDAPS - com SSL/TLS)
    /// </summary>
    public int Port { get; set; } = 389;

    /// <summary>
    /// Base DN (Distinguished Name) para buscar usuários
    /// Exemplo: "dc=empresa,dc=com" ou "ou=users,dc=empresa,dc=com"
    /// </summary>
    public string BaseDn { get; set; } = string.Empty;

    /// <summary>
    /// Domínio do Active Directory (opcional)
    /// Exemplo: "EMPRESA" - usado para autenticação DOMAIN\username
    /// </summary>
    public string? Domain { get; set; }

    /// <summary>
    /// Service Account (DN) para consultas LDAP (recomendado em produção)
    /// Exemplo: "CN=_svcmonitoringIACP,OU=Contas de Servico,OU=..."
    /// </summary>
    public string? ServiceAccountDn { get; set; }

    /// <summary>
    /// Senha da Service Account
    /// </summary>
    public string? ServiceAccountPassword { get; set; }

    /// <summary>
    /// Usar SSL/TLS para conexão segura
    /// Recomendado: true em produção
    /// </summary>
    public bool UseSsl { get; set; } = false;

    /// <summary>
    /// Timeout em segundos para operações LDAP
    /// </summary>
    public int TimeoutSeconds { get; set; } = 30;

    /// <summary>
    /// Atributo LDAP usado como username
    /// Padrão AD: "sAMAccountName"
    /// Padrão LDAP: "uid"
    /// </summary>
    public string UsernameAttribute { get; set; } = "sAMAccountName";

    /// <summary>
    /// Atributo LDAP para email
    /// Padrão AD: "mail"
    /// </summary>
    public string EmailAttribute { get; set; } = "mail";

    /// <summary>
    /// Atributo LDAP para grupos
    /// Padrão AD: "memberOf"
    /// </summary>
    public string GroupAttribute { get; set; } = "memberOf";

    /// <summary>
    /// Se true, usa o modo mock com credenciais hardcoded
    /// Se false, conecta ao LDAP/AD real
    /// </summary>
    public bool UseMockMode { get; set; } = true;

    /// <summary>
    /// Senha local para o usuário "superadmin" (fallback quando LDAP real está ativo)
    /// </summary>
    public string? LocalSuperAdminPassword { get; set; }

    /// <summary>
    /// Senha local para o usuário "admin" (fallback quando LDAP real está ativo)
    /// </summary>
    public string? LocalAdminPassword { get; set; }

    /// <summary>
    /// Valida se as configurações obrigatórias estão preenchidas
    /// </summary>
    public bool IsValid()
    {
        if (UseMockMode) return true;

        return !string.IsNullOrWhiteSpace(Host) 
            && !string.IsNullOrWhiteSpace(BaseDn) 
            && Port > 0;
    }
}
