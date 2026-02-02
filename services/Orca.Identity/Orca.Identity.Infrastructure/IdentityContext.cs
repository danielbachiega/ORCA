using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.ChangeTracking;
using Orca.Identity.Domain.Entities;

namespace Orca.Identity.Infrastructure;

public class IdentityContext : DbContext
{
    public IdentityContext(DbContextOptions<IdentityContext> options) 
        : base(options) 
    { 
    }

    // Definem quais tabelas existem no banco
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<User> Users => Set<User>();
    
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // ========== Configuração de Role ==========
        builder.Entity<Role>()
            .HasKey(r => r.Id);

        builder.Entity<Role>()
            .HasIndex(r => r.Name)
            .IsUnique();
        
        builder.Entity<Role>()
            .Property(r => r.AccessType)
            .IsRequired();

        builder.Entity<Role>()
            .Property(r => r.LdapGroups)
            .HasConversion(
                v => string.Join(',', v),
                v => v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList()
            )
            .Metadata.SetValueComparer(new ValueComparer<List<string>>(
                (c1, c2) => (c1 ?? new List<string>()).SequenceEqual(c2 ?? new List<string>()),
                c => (c ?? new List<string>()).Aggregate(0, (a, v) => HashCode.Combine(a, v == null ? 0 : v.GetHashCode())),
                c => (c ?? new List<string>()).ToList()
            ));

        // ========== Configuração de User ==========
        builder.Entity<User>()
            .HasKey(u => u.Id);

        builder.Entity<User>()
            .HasIndex(u => u.Username)
            .IsUnique();

        builder.Entity<User>()
            .HasIndex(u => u.Email);

        builder.Entity<User>()
            .Property(u => u.LdapGroups)
            .HasConversion(
                v => string.Join(',', v),
                v => v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList()
            )
            .Metadata.SetValueComparer(new ValueComparer<List<string>>(
                (c1, c2) => (c1 ?? new List<string>()).SequenceEqual(c2 ?? new List<string>()),
                c => (c ?? new List<string>()).Aggregate(0, (a, v) => HashCode.Combine(a, v == null ? 0 : v.GetHashCode())),
                c => (c ?? new List<string>()).ToList()
            ));

        builder.Entity<User>()
            .Property(u => u.RoleIds)
            .HasConversion(
                v => string.Join(',', v),
                v => v.Split(',', StringSplitOptions.RemoveEmptyEntries)
                    .Select(Guid.Parse).ToList()
            )
            .Metadata.SetValueComparer(new ValueComparer<List<Guid>>(
                (c1, c2) => (c1 ?? new List<Guid>()).SequenceEqual(c2 ?? new List<Guid>()),
                c => (c ?? new List<Guid>()).Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
                c => (c ?? new List<Guid>()).ToList()
            ));

        // ========== SEED DE DADOS ==========

        // IDs fixos para roles padrão
        var adminRoleId = Guid.Parse("11111111-1111-1111-1111-111111111111");
        var editorRoleId = Guid.Parse("22222222-2222-2222-2222-222222222222");
        var consumerRoleId = Guid.Parse("33333333-3333-3333-3333-333333333333");

        // Seed de Roles Padrão
        builder.Entity<Role>().HasData(
            new Role
            {
                Id = adminRoleId,
                Name = "Admin",
                Description = "Administradores do sistema - acesso total",
                LdapGroups = new List<string> { "Admins", "TI" },
                AccessType = RoleAccessType.Admin | RoleAccessType.Editor | RoleAccessType.Consumer
            },
            new Role
            {
                Id = editorRoleId,
                Name = "Editor",
                Description = "Editores - podem criar e editar ofertas",
                LdapGroups = new List<string> { "Editors", "Developers" },
                AccessType = RoleAccessType.Editor | RoleAccessType.Consumer
            },
            new Role
            {
                Id = consumerRoleId,
                Name = "Consumer",
                Description = "Consumidores - podem solicitar execuções",
                LdapGroups = new List<string> { "Users" },
                AccessType = RoleAccessType.Consumer
            }
        );

        // Seed de Super User
        var superUserId = Guid.Parse("99999999-9999-9999-9999-999999999999");

        builder.Entity<User>().HasData(
            new User
            {
                Id = superUserId,
                Username = "superadmin",
                Email = "admin@orca.local",
                LdapGroups = new List<string> { "Admins" },
                RoleIds = new List<Guid> { adminRoleId },
                LastLoginAtUtc = DateTime.UtcNow,
                IsActive = true
            }
        );
    }
}