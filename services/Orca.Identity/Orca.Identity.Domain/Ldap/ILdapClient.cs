namespace Orca.Identity.Domain.Ldap;

public interface ILdapClient
{
    /// <summary>
    /// Valida credenciais de um usuário no LDAP/Active Directory
    /// </summary>
    /// <param name="username">Username do usuário</param>
    /// <param name="password">Senha do usuário</param>
    /// <returns>True se credenciais válidas, False caso contrário</returns>
    Task<bool> ValidateCredentialsAsync(string username, string password);

    /// <summary>
    /// Busca grupos LDAP de um usuário no Active Directory
    /// </summary>
    /// <param name="username">Username do usuário (ex: "daniel.bachiega")</param>
    /// <returns>Lista de grupos LDAP (ex: ["TI", "Admins", "Developers"])</returns>
    Task<List<string>> GetUserGroupsAsync(string username);
}