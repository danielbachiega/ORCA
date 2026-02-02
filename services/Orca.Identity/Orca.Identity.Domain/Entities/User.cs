using System;

namespace Orca.Identity.Domain.Entities;

public class User
{
    public Guid Id { get; set; }
    public string Username { get; set; } = default!;
    public string Email { get; set; } = default!;
    public List<string> LdapGroups { get; set; } = new();
    public List<Guid> RoleIds { get; set; } = new();  // Roles do usuário
    public DateTime LastLoginAtUtc { get; set; }
    public bool IsActive { get; set; } = true;
}