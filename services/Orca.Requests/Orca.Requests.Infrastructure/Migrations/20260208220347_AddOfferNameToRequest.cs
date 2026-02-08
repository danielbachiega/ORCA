using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Orca.Requests.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddOfferNameToRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "OfferName",
                table: "Requests",
                type: "text",
                nullable: false,
                defaultValue: "");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "OfferName",
                table: "Requests");
        }
    }
}
