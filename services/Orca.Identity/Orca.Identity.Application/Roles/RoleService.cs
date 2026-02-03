using Orca.Identity.Domain.Entities;
using Orca.Identity.Domain.Repositories;

namespace Orca.Identity.Application.Roles;

public class RoleService : IRoleService
{
    private readonly IRoleRepository _roleRepository;

    public RoleService(IRoleRepository roleRepository)
    {
        _roleRepository = roleRepository;
    }

    public async Task<RoleDetailsDto> CreateAsync(CreateRoleDto dto)
    {
        // Validação simples
        if (string.IsNullOrWhiteSpace(dto.Name))
            throw new ArgumentException("Nome da role é obrigatório");

        // Converter DTO → Entity
        var role = dto.ToEntity();
        
        // Persistir
        await _roleRepository.AddAsync(role);
        
        // Converter Entity → DTO
        return role.ToDetails();
    }

    public async Task<RoleDetailsDto> UpdateAsync(Guid id, UpdateRoleDto dto)
    {
        var role = await _roleRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Role com ID {id} não encontrada");

        // Aplicar mudanças
        dto.Apply(role);
        
        await _roleRepository.UpdateAsync(role);
        
        return role.ToDetails();
    }

    public async Task<RoleDetailsDto?> GetByIdAsync(Guid id)
    {
        var role = await _roleRepository.GetByIdAsync(id);
        return role?.ToDetails();
    }

    public async Task<RoleSummaryDto?> GetByNameAsync(string name)
    {
        var role = await _roleRepository.GetByNameAsync(name);
        return role?.ToSummary();
    }

    public async Task<List<RoleSummaryDto>> GetAllAsync()
    {
        var roles = await _roleRepository.GetAllAsync();
        return roles.Select(r => r.ToSummary()).ToList();
    }

    public async Task<List<RoleSummaryDto>> GetByLdapGroupAsync(string ldapGroup)
    {
        var roles = await _roleRepository.GetByLdapGroupAsync(ldapGroup);
        return roles.Select(r => r.ToSummary()).ToList();
    }

    public async Task DeleteAsync(Guid id)
    {
        var role = await _roleRepository.GetByIdAsync(id)
            ?? throw new KeyNotFoundException($"Role com ID {id} não encontrada");

        await _roleRepository.DeleteAsync(id);
    }
}