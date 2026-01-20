using Microsoft.EntityFrameworkCore;
using Orca.Forms.Domain.Entities;

namespace Orca.Forms.Infrastructure;

public class FormsContext : DbContext
{
    public FormsContext(DbContextOptions<FormsContext> options) 
        : base(options) 
    { 
    }

    public DbSet<FormDefinition> FormDefinitions => Set<FormDefinition>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configuração de FormDefinition
        modelBuilder.Entity<FormDefinition>()
            .HasKey(fd => fd.Id);

        modelBuilder.Entity<FormDefinition>()
            .HasIndex(fd => fd.OfferId);
    }
}
