namespace Orca.Identity.Application.Roles;

public interface IRoleService
{
    Task<RoleDetailsDto> CreateAsync(CreateRoleDto dto);
    Task<RoleDetailsDto> UpdateAsync(Guid id, UpdateRoleDto dto);
    Task<RoleDetailsDto?> GetByIdAsync(Guid id);
    Task<RoleSummaryDto?> GetByNameAsync(string name);
    Task<List<RoleSummaryDto>> GetAllAsync();
    Task<List<RoleSummaryDto>> GetByLdapGroupAsync(string ldapGroup);
    Task DeleteAsync(Guid id);
}