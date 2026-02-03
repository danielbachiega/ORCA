using Orca.Identity.Domain.Entities;

namespace Orca.Identity.Application.Roles;


public record RoleSummaryDto(
    Guid Id,
    string Name,
    string? Description,
    string[] LdapGroups,
    string AccessType);

public record RoleDetailsDto(
    Guid Id,
    string Name,
    string? Description,
    string[] LdapGroups,
    string AccessType);

// === DTOs de Entrada ===
public class CreateRoleDto
{
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string[] LdapGroups { get; set; } = Array.Empty<string>();
    public RoleAccessType AccessType { get; set; } = RoleAccessType.None;
}

public class UpdateRoleDto
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string? Description { get; set; }
    public string[] LdapGroups { get; set; } = Array.Empty<string>();
    public RoleAccessType AccessType { get; set; } = RoleAccessType.None;
}

