using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Orca.Catalog.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOfferImageAssetId : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ImageAssetId",
                table: "Offers",
                type: "character varying(100)",
                maxLength: 100,
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ImageAssetId",
                table: "Offers");
        }
    }
}
