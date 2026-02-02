using Microsoft.EntityFrameworkCore;
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
    
    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Configuração de Role
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
                v => string.Join(',', v),                // Converte a lista em uma string separada por vírgula para salvar
                v => v.Split(',', StringSplitOptions.RemoveEmptyEntries).ToList() // Converte de volta para lista
    );

    }
}
