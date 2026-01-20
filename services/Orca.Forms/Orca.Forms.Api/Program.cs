using Microsoft.EntityFrameworkCore;
using FluentValidation.AspNetCore;
using FluentValidation;
using Orca.Forms.Infrastructure;
using Orca.Forms.Infrastructure.Repositories;
using Orca.Forms.Domain.Repositories;
using Orca.Forms.Application.FormDefinitions;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(o => o.AddPolicy("DevCors", p => p
    .WithOrigins("http://localhost:8080", "http://localhost:80", "http://localhost")
    .AllowAnyHeader()
    .AllowAnyMethod()));
builder.Services.AddControllers();
builder.Services.AddValidatorsFromAssemblyContaining<FormDefinitionValidator>();
builder.Services.AddFluentValidationClientsideAdapters();
builder.Services.AddHealthChecks();

// Registrar DbContext
builder.Services.AddDbContext<FormsContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Registrar repositórios e serviços
builder.Services.AddScoped<IFormDefinitionRepository, FormDefinitionRepository>();

var app = builder.Build();

// Apply migrations
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<FormsContext>();
    dbContext.Database.Migrate();
}

app.UseRouting();
app.UseCors("DevCors");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseAuthorization();

app.MapHealthChecks("/health");
app.MapControllers();
app.Run();
