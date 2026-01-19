using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Orca.Catalog.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddIsPublishedToFormDefinition : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "IsPublished",
                table: "FormDefinitions",
                type: "boolean",
                nullable: false,
                defaultValue: false);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "IsPublished",
                table: "FormDefinitions");
        }
    }
}
