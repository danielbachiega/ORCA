using Microsoft.EntityFrameworkCore;
using FluentValidation.AspNetCore;
using FluentValidation;
using Orca.Requests.Infrastructure;
using Orca.Requests.Infrastructure.Repositories;
using Orca.Requests.Domain.Repositories;
using Orca.Requests.Application.Requests;
using Orca.Requests.Api.Middleware;
using MassTransit;
using Orca.Requests.Application.Consumers;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddCors(o => o.AddPolicy("DevCors", p => p
    .WithOrigins("http://localhost:5173", "http://localhost:8080", "http://localhost:80", "http://localhost")
    .AllowAnyHeader()
    .AllowAnyMethod()));
builder.Services.AddControllers();
builder.Services.AddValidatorsFromAssemblyContaining<CreateRequestDtoValidator>();
builder.Services.AddFluentValidationClientsideAdapters();
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddHealthChecks();

// Registrar Services
builder.Services.AddScoped<IRequestService, RequestService>();

// Configurar MassTransit + RabbitMQ
builder.Services.AddMassTransit(x =>
{
    // Registrar consumers
    x.AddConsumer<RequestStatusUpdatedConsumer>();

    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(builder.Configuration["RabbitMq:Host"] ?? "localhost", "/", h =>
        {
            h.Username(builder.Configuration["RabbitMq:Username"] ?? "guest");
            h.Password(builder.Configuration["RabbitMq:Password"] ?? "guest");
        });

        // 📨 Configurar endpoint para RequestStatusUpdatedEvent
        cfg.ReceiveEndpoint("requests-status-updated", e =>
        {
            e.ConfigureConsumer<RequestStatusUpdatedConsumer>(context);
        });

        cfg.ConfigureEndpoints(context);
    });
});

// ProblemDetails (RFC 7807)
builder.Services.AddProblemDetails(options =>
{
    options.CustomizeProblemDetails = context =>
    {
        context.ProblemDetails.Instance = $"{context.HttpContext.Request.Method} {context.HttpContext.Request.Path}";
        context.ProblemDetails.Extensions["traceId"] = context.HttpContext.TraceIdentifier;
    };
});
builder.Services.AddExceptionHandler<GlobalExceptionHandler>();

// Registrar DbContext
builder.Services.AddDbContext<RequestsContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Registrar Repositories
builder.Services.AddScoped<IRequestRepository, RequestRepository>();

var app = builder.Build();

// Apply migrations
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<RequestsContext>();
    if (app.Environment.IsDevelopment())
    {
        dbContext.Database.Migrate();
    }
}

app.UseRouting();
app.UseCors("DevCors");

// Exception handling (ProblemDetails)
app.UseExceptionHandler();
app.UseStatusCodePages();

// Configure the HTTP request pipeline
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.MapHealthChecks("/health");
app.MapControllers();
app.Run();