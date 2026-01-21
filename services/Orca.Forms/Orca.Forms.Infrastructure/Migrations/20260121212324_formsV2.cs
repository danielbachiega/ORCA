using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Orca.Forms.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class formsV2 : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Rules",
                table: "FormDefinitions");

            migrationBuilder.DropColumn(
                name: "UiSchema",
                table: "FormDefinitions");

            migrationBuilder.RenameColumn(
                name: "JsonSchema",
                table: "FormDefinitions",
                newName: "SchemaJson");

            migrationBuilder.AddColumn<DateTime>(
                name: "UpdatedAtUtc",
                table: "FormDefinitions",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "UpdatedAtUtc",
                table: "FormDefinitions");

            migrationBuilder.RenameColumn(
                name: "SchemaJson",
                table: "FormDefinitions",
                newName: "JsonSchema");

            migrationBuilder.AddColumn<string>(
                name: "Rules",
                table: "FormDefinitions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<string>(
                name: "UiSchema",
                table: "FormDefinitions",
                type: "text",
                nullable: true);
        }
    }
}
