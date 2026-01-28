using Microsoft.EntityFrameworkCore;
using Orca.Orchestrator.Domain.Entities;

namespace Orca.Orchestrator.Infrastructure;

public class OrchestratorContext : DbContext
{
    public OrchestratorContext(DbContextOptions<OrchestratorContext> options) 
        : base(options) 
    { 
    }

    // DbSet = tabela no banco
    public DbSet<JobExecution> JobExecutions => Set<JobExecution>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configuração da entidade JobExecution
        modelBuilder.Entity<JobExecution>()
            .HasKey(j => j.Id);

        // Índices para queries frequentes
        modelBuilder.Entity<JobExecution>()
            .HasIndex(j => j.RequestId);

        modelBuilder.Entity<JobExecution>()
            .HasIndex(j => j.ExecutionStatus);

        modelBuilder.Entity<JobExecution>()
            .HasIndex(j => j.AwxOoJobId);

        // Configuração do ExecutionPayload como JSONB (PostgreSQL)
        modelBuilder.Entity<JobExecution>()
            .Property(j => j.ExecutionPayload)
            .HasColumnType("jsonb");

        // Configuração do ExecutionResponse como JSONB (PostgreSQL)
        modelBuilder.Entity<JobExecution>()
            .Property(j => j.ExecutionResponse)
            .HasColumnType("jsonb");
    }
}