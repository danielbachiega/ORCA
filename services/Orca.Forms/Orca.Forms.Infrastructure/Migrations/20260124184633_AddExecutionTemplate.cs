using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Orca.Forms.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddExecutionTemplate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "ExecutionTemplates",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    FormDefinitionId = table.Column<Guid>(type: "uuid", nullable: false),
                    TargetType = table.Column<int>(type: "integer", nullable: false),
                    ResourceType = table.Column<int>(type: "integer", nullable: true),
                    ResourceId = table.Column<string>(type: "text", nullable: false),
                    FieldMappings = table.Column<string>(type: "jsonb", nullable: false),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_ExecutionTemplates", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_ExecutionTemplates_FormDefinitionId",
                table: "ExecutionTemplates",
                column: "FormDefinitionId",
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "ExecutionTemplates");
        }
    }
}
