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
    public DbSet<ExecutionTemplate> ExecutionTemplates => Set<ExecutionTemplate>();
    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configuração de FormDefinition
        modelBuilder.Entity<FormDefinition>()
            .HasKey(fd => fd.Id);

        modelBuilder.Entity<FormDefinition>()
            .HasIndex(fd => fd.OfferId);
    
        modelBuilder.Entity<ExecutionTemplate>()
            .HasKey(et => et.Id);

        modelBuilder.Entity<ExecutionTemplate>()
            .HasIndex(et => et.FormDefinitionId)
            .IsUnique();

        modelBuilder.Entity<ExecutionTemplate>()
            .Property(et => et.FieldMappings)
            .HasColumnType("jsonb")
            .HasConversion(
                v => System.Text.Json.JsonSerializer.Serialize(v, default(System.Text.Json.JsonSerializerOptions)),
                v => System.Text.Json.JsonSerializer.Deserialize<List<FieldMapping>>(v, default(System.Text.Json.JsonSerializerOptions)) ?? new())
            .Metadata.SetValueComparer(
                new Microsoft.EntityFrameworkCore.ChangeTracking.ValueComparer<List<FieldMapping>>(
                    (c1, c2) => System.Text.Json.JsonSerializer.Serialize(c1, default(System.Text.Json.JsonSerializerOptions)) == 
                                System.Text.Json.JsonSerializer.Serialize(c2, default(System.Text.Json.JsonSerializerOptions)),
                    c => c.Aggregate(0, (a, v) => HashCode.Combine(a, v.GetHashCode())),
                    c => System.Text.Json.JsonSerializer.Deserialize<List<FieldMapping>>(
                        System.Text.Json.JsonSerializer.Serialize(c, default(System.Text.Json.JsonSerializerOptions)), 
                        default(System.Text.Json.JsonSerializerOptions)) ?? new()));

    }

    }
