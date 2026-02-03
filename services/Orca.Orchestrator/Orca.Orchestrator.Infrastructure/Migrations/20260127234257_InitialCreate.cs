using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Orca.Orchestrator.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class InitialCreate : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "JobExecutions",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "uuid", nullable: false),
                    RequestId = table.Column<Guid>(type: "uuid", nullable: false),
                    ExecutionTargetType = table.Column<int>(type: "integer", nullable: false),
                    ExecutionResourceType = table.Column<int>(type: "integer", nullable: true),
                    ExecutionResourceId = table.Column<string>(type: "text", nullable: false),
                    ExecutionPayload = table.Column<string>(type: "jsonb", nullable: true),
                    ExecutionResponse = table.Column<string>(type: "jsonb", nullable: true),
                    ExecutionStatus = table.Column<string>(type: "text", nullable: false),
                    AwxOoJobId = table.Column<string>(type: "text", nullable: true),
                    AwxOoExecutionStatus = table.Column<string>(type: "text", nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    SentToAwxOoAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    CompletedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    PollingAttempts = table.Column<int>(type: "integer", nullable: false),
                    LastPolledAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true),
                    ErrorMessage = table.Column<string>(type: "text", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_JobExecutions", x => x.Id);
                });

            migrationBuilder.CreateIndex(
                name: "IX_JobExecutions_AwxOoJobId",
                table: "JobExecutions",
                column: "AwxOoJobId");

            migrationBuilder.CreateIndex(
                name: "IX_JobExecutions_ExecutionStatus",
                table: "JobExecutions",
                column: "ExecutionStatus");

            migrationBuilder.CreateIndex(
                name: "IX_JobExecutions_RequestId",
                table: "JobExecutions",
                column: "RequestId");
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "JobExecutions");
        }
    }
}
