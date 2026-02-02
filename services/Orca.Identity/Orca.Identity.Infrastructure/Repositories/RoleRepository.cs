using Microsoft.EntityFrameworkCore;
using Orca.Identity.Domain.Entities;
using Orca.Identity.Domain.Repositories;

namespace Orca.Identity.Infrastructure.Repositories;

public class RoleRepository : IRoleRepository
{
    private readonly IdentityContext _context;

    public RoleRepository(IdentityContext context)
    {
        _context = context;
    }

    public async Task<Role?> GetByIdAsync(Guid id)
    {
        return await _context.Roles.FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<Role?> GetByNameAsync(string name)
    {
        return await _context.Roles.FirstOrDefaultAsync(r => r.Name == name);
    }

    public async Task<List<Role>> GetAllAsync()
    {
        return await _context.Roles.ToListAsync();
    }

    public async Task<List<Role>> GetByLdapGroupAsync(string ldapGroup)
    {
        // Busca roles que contêm este grupo LDAP
        // Nota: ToListAsync() ANTES do Where porque LdapGroups é convertido de string
        // EF Core não consegue traduzir Contains em lista convertida para SQL
        var allRoles = await _context.Roles.ToListAsync();
        return allRoles
            .Where(r => r.LdapGroups.Contains(ldapGroup))
            .ToList();
    }

    public async Task AddAsync(Role role)
    {
        role.Id = Guid.NewGuid();
        await _context.Roles.AddAsync(role);
        await _context.SaveChangesAsync();
    }

    public async Task UpdateAsync(Role role)
    {
        _context.Roles.Update(role);
        await _context.SaveChangesAsync();
    }

    public async Task DeleteAsync(Guid id)
    {
        var role = await _context.Roles.FirstOrDefaultAsync(r => r.Id == id);
        if (role != null)
        {
            _context.Roles.Remove(role);
            await _context.SaveChangesAsync();
        }
    }
}