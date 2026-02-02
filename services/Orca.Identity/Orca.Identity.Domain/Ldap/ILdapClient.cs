namespace Orca.Identity.Domain.Ldap;

public interface ILdapClient
{
    /// <summary>
    /// Busca grupos LDAP de um usuário no Active Directory
    /// </summary>
    /// <param name="username">Username do usuário (ex: "daniel.bachiega")</param>
    /// <returns>Lista de grupos LDAP (ex: ["TI", "Admins", "Developers"])</returns>
    Task<List<string>> GetUserGroupsAsync(string username);
}