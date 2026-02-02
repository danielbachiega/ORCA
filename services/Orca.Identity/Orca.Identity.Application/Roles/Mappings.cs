using Orca.Identity.Domain.Entities;
    
namespace Orca.Identity.Application.Roles;

public static class RoleMapping
{
    public static RoleSummaryDto ToSummary(this Role r)
        => new(r.Id, r.Name, r.Description, r.LdapGroups.ToArray(), r.AccessType.ToString());
    
    public static RoleDetailsDto ToDetails(this Role r)
        => new(r.Id, r.Name, r.Description, r.LdapGroups.ToArray(), r.AccessType.ToString());
    
    // DTO → Domain (Entrada)
    public static Role ToEntity(this CreateRoleDto dto)
        => new()
        {
            Name = dto.Name,
            Description = dto.Description ?? string.Empty,
            LdapGroups = dto.LdapGroups.ToList(),
            AccessType = dto.AccessType 
        };

    public static Role Apply(this UpdateRoleDto dto, Role entity)
    {
        entity.Name = dto.Name;
        entity.Description = dto.Description ?? string.Empty;
        entity.LdapGroups = dto.LdapGroups.ToList();
        entity.AccessType = dto.AccessType;
        return entity;
    }
}