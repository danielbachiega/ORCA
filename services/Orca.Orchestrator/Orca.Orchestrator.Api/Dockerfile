FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiar csproj e restaurar dependências
COPY ["services/Orca.Orchestrator/Orca.Orchestrator.Api/Orca.Orchestrator.Api.csproj", "services/Orca.Orchestrator/Orca.Orchestrator.Api/"]
COPY ["services/Orca.Orchestrator/Orca.Orchestrator.Application/Orca.Orchestrator.Application.csproj", "services/Orca.Orchestrator/Orca.Orchestrator.Application/"]
COPY ["services/Orca.Orchestrator/Orca.Orchestrator.Domain/Orca.Orchestrator.Domain.csproj", "services/Orca.Orchestrator/Orca.Orchestrator.Domain/"]
COPY ["services/Orca.Orchestrator/Orca.Orchestrator.Infrastructure/Orca.Orchestrator.Infrastructure.csproj", "services/Orca.Orchestrator/Orca.Orchestrator.Infrastructure/"]
COPY ["services/Orca.SharedContracts/Orca.SharedContracts.csproj", "services/Orca.SharedContracts/"]

RUN dotnet restore "services/Orca.Orchestrator/Orca.Orchestrator.Api/Orca.Orchestrator.Api.csproj"

# Copiar código e compilar
COPY services/Orca.Orchestrator/ services/Orca.Orchestrator/
COPY services/Orca.SharedContracts/ services/Orca.SharedContracts/
WORKDIR "/src/services/Orca.Orchestrator/Orca.Orchestrator.Api"
RUN dotnet build "Orca.Orchestrator.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Orca.Orchestrator.Api.csproj" -c Release -o /app/publish

# Imagem final
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
ARG ExternalServices__AwxBaseUrl
ARG ExternalServices__AwxUsername
ARG ExternalServices__AwxPassword
ARG ExternalServices__OoBaseUrl
ARG ExternalServices__OoUsername
ARG ExternalServices__OoPassword
ENV ExternalServices__AwxBaseUrl=${ExternalServices__AwxBaseUrl}
ENV ExternalServices__AwxUsername=${ExternalServices__AwxUsername}
ENV ExternalServices__AwxPassword=${ExternalServices__AwxPassword}
ENV ExternalServices__OoBaseUrl=${ExternalServices__OoBaseUrl}
ENV ExternalServices__OoUsername=${ExternalServices__OoUsername}
ENV ExternalServices__OoPassword=${ExternalServices__OoPassword}
EXPOSE 5005
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Orca.Orchestrator.Api.dll"]
