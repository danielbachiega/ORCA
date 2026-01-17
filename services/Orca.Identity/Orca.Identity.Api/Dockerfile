FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["services/Orca.Identity/Orca.Identity.Api/Orca.Identity.Api.csproj", "services/Orca.Identity/Orca.Identity.Api/"]
COPY ["services/Orca.Identity/Orca.Identity.Application/Orca.Identity.Application.csproj", "services/Orca.Identity/Orca.Identity.Application/"]
COPY ["services/Orca.Identity/Orca.Identity.Domain/Orca.Identity.Domain.csproj", "services/Orca.Identity/Orca.Identity.Domain/"]
COPY ["services/Orca.Identity/Orca.Identity.Infrastructure/Orca.Identity.Infrastructure.csproj", "services/Orca.Identity/Orca.Identity.Infrastructure/"]
COPY ["shared/Orca.Shared/Orca.Shared.Domain/Orca.Shared.Domain/Orca.Shared.Domain.csproj", "shared/Orca.Shared/Orca.Shared.Domain/Orca.Shared.Domain/"]
COPY ["shared/Orca.Shared/Orca.Shared.Events/Orca.Shared.Events/Orca.Shared.Events.csproj", "shared/Orca.Shared/Orca.Shared.Events/Orca.Shared.Events/"]
COPY ["shared/Orca.Shared/Orca.Shared.Contracts/Orca.Shared.Contracts/Orca.Shared.Contracts.csproj", "shared/Orca.Shared/Orca.Shared.Contracts/Orca.Shared.Contracts/"]

RUN dotnet restore "services/Orca.Identity/Orca.Identity.Api/Orca.Identity.Api.csproj"

COPY . .
WORKDIR "/src/services/Orca.Identity/Orca.Identity.Api"
RUN dotnet build "Orca.Identity.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Orca.Identity.Api.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Orca.Identity.Api.dll"]
