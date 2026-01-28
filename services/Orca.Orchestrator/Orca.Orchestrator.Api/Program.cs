using Microsoft.EntityFrameworkCore;
using MassTransit;
using Orca.Orchestrator.Infrastructure;
using Orca.Orchestrator.Infrastructure.Repositories;
using Orca.Orchestrator.Infrastructure.Clients;
using Orca.Orchestrator.Domain.Repositories;
using Orca.Orchestrator.Application.JobExecutions;
using Orca.Orchestrator.Application.Consumers;
using Orca.Orchestrator.Application.Workers;
using Orca.Orchestrator.Application.Clients;
using Orca.SharedContracts.Events;
using Microsoft.AspNetCore.Builder;

var builder = WebApplication.CreateBuilder(args);


builder.Services.AddDbContext<OrchestratorContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));


builder.Services.AddScoped<IJobExecutionRepository, JobExecutionRepository>();
builder.Services.AddScoped<IJobExecutionService, JobExecutionService>();

builder.Services.AddHttpClient<AwxClient>()
    .ConfigureHttpClient(client =>
    {
        client.BaseAddress = new Uri(builder.Configuration["ExternalServices:AwxBaseUrl"]!);
        client.Timeout = TimeSpan.FromSeconds(30);
    });

builder.Services.AddHttpClient<OoClient>()
    .ConfigureHttpClient(client =>
    {
        client.BaseAddress = new Uri(builder.Configuration["ExternalServices:OoBaseUrl"]!);
        client.Timeout = TimeSpan.FromSeconds(30);
    });

// Registrar os clientes como IExecutionClient (injeção por tipo no JobExecutionService)
builder.Services.AddScoped<IExecutionClient>(sp => sp.GetRequiredService<AwxClient>());
builder.Services.AddScoped<IExecutionClient>(sp => sp.GetRequiredService<OoClient>());

//  CONFIGURAR MASSTRANSIT + RABBITMQ
builder.Services.AddMassTransit(x =>
{
    //  Registrar Consumer
    x.AddConsumer<RequestCreatedEventConsumer>();

    //  Configurar RabbitMQ
    x.UsingRabbitMq((context, cfg) =>
    {
        cfg.Host(builder.Configuration["RabbitMQ:Host"], h =>
        {
            h.Username(builder.Configuration["RabbitMQ:Username"]!);
            h.Password(builder.Configuration["RabbitMQ:Password"]!);
        });

        // 📨 Configurar Endpoint para RequestCreatedEvent
        cfg.ReceiveEndpoint("orchestrator-requests-created", e =>
        {
            e.ConfigureConsumer<RequestCreatedEventConsumer>(context);
        });

        cfg.ConfigureEndpoints(context);
    });
});

//  REGISTRAR POLLING WORKER
builder.Services.AddHostedService<PollingWorker>();


//  CONTROLLERS E LOGGING

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();


//  APLICAR MIGRATIONS AUTOMATICAMENTE
using (var scope = app.Services.CreateScope())
{
    var dbContext = scope.ServiceProvider.GetRequiredService<OrchestratorContext>();
    dbContext.Database.Migrate();
}

//  MIDDLEWARE
if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.Run();