using Microsoft.EntityFrameworkCore;
using Orca.Catalog.Domain.Entities;

namespace Orca.Catalog.Infrastructure;

public class CatalogContext : DbContext
{
    public CatalogContext(DbContextOptions<CatalogContext> options) 
        : base(options) 
    { 
    }

    // Definem quais tabelas existem no banco
    public DbSet<Offer> Offers => Set<Offer>();
    public DbSet<OfferRole> OfferRoles => Set<OfferRole>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Configuração de Offer
        builder.Entity<Offer>()
            .HasKey(o => o.Id);

        builder.Entity<Offer>()
            .HasIndex(o => o.Slug)
            .IsUnique();

        // Configuração de OfferRole
        builder.Entity<OfferRole>()
            .HasKey(or => new { or.OfferId, or.RoleName });

        builder.Entity<OfferRole>()
            .HasOne(or => or.Offer)
            .WithMany(o => o.VisibleToRoles)
            .HasForeignKey(or => or.OfferId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
