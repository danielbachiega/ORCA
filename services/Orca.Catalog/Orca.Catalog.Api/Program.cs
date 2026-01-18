using Orca.Catalog.Infrastructure.Extensions;
using Microsoft.EntityFrameworkCore;
using FluentValidation.AspNetCore;
using FluentValidation;
using Orca.Catalog.Application.Offers;


var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(o => o.AddPolicy("DevCors",p =>p.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
builder.Services.AddControllers(); 
builder.Services.AddValidatorsFromAssemblyContaining<OfferValidator>();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddFluentValidationClientsideAdapters();
builder.Services.AddHealthChecks();

// Registrar DbContext
builder.Services.AddDbContext<Orca.Catalog.Infrastructure.CatalogContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCatalogInfrastructure(builder.Configuration);

var app = builder.Build();

// Apply migrations
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<Orca.Catalog.Infrastructure.CatalogContext>();
    dbContext.Database.Migrate();
}

app.UseCors("DevCors");

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}
app.UseMiddleware<Orca.Catalog.Api.Middleware.ExceptionHandlingMiddleware>();
app.MapHealthChecks("/health");
app.MapControllers();
app.Run();


