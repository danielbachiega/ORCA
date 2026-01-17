FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["services/Orca.Requests/Orca.Requests.Api/Orca.Requests.Api.csproj", "services/Orca.Requests/Orca.Requests.Api/"]
COPY ["services/Orca.Requests/Orca.Requests.Application/Orca.Requests.Application.csproj", "services/Orca.Requests/Orca.Requests.Application/"]
COPY ["services/Orca.Requests/Orca.Requests.Domain/Orca.Requests.Domain.csproj", "services/Orca.Requests/Orca.Requests.Domain/"]
COPY ["services/Orca.Requests/Orca.Requests.Infrastructure/Orca.Requests.Infrastructure.csproj", "services/Orca.Requests/Orca.Requests.Infrastructure/"]
COPY ["shared/Orca.Shared/Orca.Shared.Domain/Orca.Shared.Domain/Orca.Shared.Domain.csproj", "shared/Orca.Shared/Orca.Shared.Domain/Orca.Shared.Domain/"]
COPY ["shared/Orca.Shared/Orca.Shared.Events/Orca.Shared.Events/Orca.Shared.Events.csproj", "shared/Orca.Shared/Orca.Shared.Events/Orca.Shared.Events/"]
COPY ["shared/Orca.Shared/Orca.Shared.Contracts/Orca.Shared.Contracts/Orca.Shared.Contracts.csproj", "shared/Orca.Shared/Orca.Shared.Contracts/Orca.Shared.Contracts/"]

RUN dotnet restore "services/Orca.Requests/Orca.Requests.Api/Orca.Requests.Api.csproj"

COPY . .
WORKDIR "/src/services/Orca.Requests/Orca.Requests.Api"
RUN dotnet build "Orca.Requests.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Orca.Requests.Api.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Orca.Requests.Api.dll"]
