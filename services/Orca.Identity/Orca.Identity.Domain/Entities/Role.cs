using System;
namespace Orca.Identity.Domain.Entities;
public class Role
{
    public Guid Id { get; set; }
    public string Name { get; set; } = default!;
    public string Description { get; set; } = default!;
    public List<string> LdapGroups { get; set; } = new();
    public RoleAccessType AccessType { get; set; }
}

[Flags]
public enum RoleAccessType
{
    None = 0,
//  Acesso Consumer tem acesso a consumir Ofertas
    Consumer = 1,
//  Acesso Admin tem acesso a criar Roles
    Admin = 2, 
//  Acesso Editor tem acesso a criar Ofertas
    Editor = 4
}