using Microsoft.EntityFrameworkCore;
using Orca.Requests.Domain.Entities;

namespace Orca.Requests.Infrastructure;

public class RequestsContext : DbContext
{
    public RequestsContext(DbContextOptions<RequestsContext> options) 
        : base(options) 
    { 
    }

    // DbSet = tabela no banco
    public DbSet<Request> Requests => Set<Request>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configuração da entidade Request
        modelBuilder.Entity<Request>()
            .HasKey(r => r.Id);

        // Índices para queries frequentes
        modelBuilder.Entity<Request>()
            .HasIndex(r => r.OfferId);

        modelBuilder.Entity<Request>()
            .HasIndex(r => r.UserId);

        modelBuilder.Entity<Request>()
            .HasIndex(r => r.Status);

        // Configuração do FormData como JSONB (PostgreSQL)
        modelBuilder.Entity<Request>()
            .Property(r => r.FormData)
            .HasColumnType("jsonb");
    }
}