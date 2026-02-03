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
            migrationBuilder.RenameColumn(
                name: "UpdateAtUtc",
                table: "Offers",
                newName: "UpdatedAtUtc");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.RenameColumn(
                name: "UpdatedAtUtc",
                table: "Offers",
                newName: "UpdateAtUtc");
        }
    }
}
