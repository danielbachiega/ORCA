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
    public DbSet<OfferVersion> OfferVersions => Set<OfferVersion>();
    public DbSet<OfferRole> OfferRoles => Set<OfferRole>();
    public DbSet<FormDefinition> FormDefinitions => Set<FormDefinition>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // Configuração de Offer
        builder.Entity<Offer>()
            .HasKey(o => o.Id);

        builder.Entity<Offer>()
            .HasIndex(o => o.Slug)
            .IsUnique();

        builder.Entity<Offer>()
            .HasMany(o => o.Versions)
            .WithOne(v => v.Offer)
            .HasForeignKey(v => v.OfferId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configuração de OfferVersion
        builder.Entity<OfferVersion>()
            .HasKey(ov => ov.Id);

        // Configuração de OfferRole
        builder.Entity<OfferRole>()
            .HasKey(or => new { or.OfferId, or.RoleName });

        builder.Entity<OfferRole>()
            .HasOne(or => or.Offer)
            .WithMany(o => o.VisibleToRoles)
            .HasForeignKey(or => or.OfferId)
            .OnDelete(DeleteBehavior.Cascade);

        // Configuração de FormDefinition
        builder.Entity<FormDefinition>()
            .HasKey(fd => fd.Id);

        builder.Entity<FormDefinition>()
            .HasOne(fd => fd.Offer)
            .WithMany()
            .HasForeignKey(fd => fd.OfferId)
            .OnDelete(DeleteBehavior.Cascade);
    }
}
