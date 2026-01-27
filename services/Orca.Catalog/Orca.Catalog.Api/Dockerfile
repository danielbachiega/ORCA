FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["services/Orca.Catalog/Orca.Catalog.Api/Orca.Catalog.Api.csproj", "services/Orca.Catalog/Orca.Catalog.Api/"]
COPY ["services/Orca.Catalog/Orca.Catalog.Application/Orca.Catalog.Application.csproj", "services/Orca.Catalog/Orca.Catalog.Application/"]
COPY ["services/Orca.Catalog/Orca.Catalog.Domain/Orca.Catalog.Domain.csproj", "services/Orca.Catalog/Orca.Catalog.Domain/"]
COPY ["services/Orca.Catalog/Orca.Catalog.Infrastructure/Orca.Catalog.Infrastructure.csproj", "services/Orca.Catalog/Orca.Catalog.Infrastructure/"]

RUN dotnet restore "services/Orca.Catalog/Orca.Catalog.Api/Orca.Catalog.Api.csproj"

COPY . .
WORKDIR "/src/services/Orca.Catalog/Orca.Catalog.Api"
RUN dotnet build "Orca.Catalog.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Orca.Catalog.Api.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Orca.Catalog.Api.dll"]
