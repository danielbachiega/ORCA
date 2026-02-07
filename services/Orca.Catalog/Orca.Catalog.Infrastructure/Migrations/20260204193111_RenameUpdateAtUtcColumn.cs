using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Orca.Catalog.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class RenameUpdateAtUtcColumn : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Offers'
          AND column_name = 'UpdateAtUtc'
    ) THEN
        ALTER TABLE ""Offers"" RENAME COLUMN ""UpdateAtUtc"" TO ""UpdatedAtUtc"";
    END IF;
END $$;
");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.Sql(@"
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name = 'Offers'
          AND column_name = 'UpdatedAtUtc'
    ) THEN
        ALTER TABLE ""Offers"" RENAME COLUMN ""UpdatedAtUtc"" TO ""UpdateAtUtc"";
    END IF;
END $$;
");
        }
    }
}
