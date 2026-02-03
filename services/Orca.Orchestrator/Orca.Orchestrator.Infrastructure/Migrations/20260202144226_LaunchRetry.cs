using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Orca.Orchestrator.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class LaunchRetry : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<string>(
                name: "LastLaunchError",
                table: "JobExecutions",
                type: "text",
                nullable: true);

            migrationBuilder.AddColumn<int>(
                name: "LaunchAttempts",
                table: "JobExecutions",
                type: "integer",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "NextLaunchAttemptAtUtc",
                table: "JobExecutions",
                type: "timestamp with time zone",
                nullable: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "LastLaunchError",
                table: "JobExecutions");

            migrationBuilder.DropColumn(
                name: "LaunchAttempts",
                table: "JobExecutions");

            migrationBuilder.DropColumn(
                name: "NextLaunchAttemptAtUtc",
                table: "JobExecutions");
        }
    }
}
