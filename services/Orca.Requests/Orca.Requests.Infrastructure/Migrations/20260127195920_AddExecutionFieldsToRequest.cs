using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Orca.Requests.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddExecutionFieldsToRequest : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "ExecutionResourceId",
                table: "Requests",
                type: "text",
                nullable: false,
                defaultValue: "");

            migrationBuilder.AddColumn<int>(
                name: "ExecutionResourceType",
                table: "Requests",
                type: "integer",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "ExecutionTargetType",
                table: "Requests",
                type: "integer",
                nullable: false,
                defaultValue: 0);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "ExecutionResourceId",
                table: "Requests");

            migrationBuilder.DropColumn(
                name: "ExecutionResourceType",
                table: "Requests");

            migrationBuilder.DropColumn(
                name: "ExecutionTargetType",
                table: "Requests");
        }
    }
}
