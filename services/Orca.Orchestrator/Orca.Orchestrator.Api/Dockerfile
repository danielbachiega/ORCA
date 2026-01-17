FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["services/Orca.Orchestrator/Orca.Orchestrator.Api/Orca.Orchestrator.Api.csproj", "services/Orca.Orchestrator/Orca.Orchestrator.Api/"]
COPY ["services/Orca.Orchestrator/Orca.Orchestrator.Application/Orca.Orchestrator.Application.csproj", "services/Orca.Orchestrator/Orca.Orchestrator.Application/"]
COPY ["services/Orca.Orchestrator/Orca.Orchestrator.Domain/Orca.Orchestrator.Domain.csproj", "services/Orca.Orchestrator/Orca.Orchestrator.Domain/"]
COPY ["services/Orca.Orchestrator/Orca.Orchestrator.Infrastructure/Orca.Orchestrator.Infrastructure.csproj", "services/Orca.Orchestrator/Orca.Orchestrator.Infrastructure/"]
COPY ["shared/Orca.Shared/Orca.Shared.Domain/Orca.Shared.Domain/Orca.Shared.Domain.csproj", "shared/Orca.Shared/Orca.Shared.Domain/Orca.Shared.Domain/"]
COPY ["shared/Orca.Shared/Orca.Shared.Events/Orca.Shared.Events/Orca.Shared.Events.csproj", "shared/Orca.Shared/Orca.Shared.Events/Orca.Shared.Events/"]
COPY ["shared/Orca.Shared/Orca.Shared.Contracts/Orca.Shared.Contracts/Orca.Shared.Contracts.csproj", "shared/Orca.Shared/Orca.Shared.Contracts/Orca.Shared.Contracts/"]

RUN dotnet restore "services/Orca.Orchestrator/Orca.Orchestrator.Api/Orca.Orchestrator.Api.csproj"

COPY . .
WORKDIR "/src/services/Orca.Orchestrator/Orca.Orchestrator.Api"
RUN dotnet build "Orca.Orchestrator.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Orca.Orchestrator.Api.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Orca.Orchestrator.Api.dll"]
