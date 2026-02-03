FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiar csproj e restaurar dependências
COPY ["services/Orca.Requests/Orca.Requests.Api/Orca.Requests.Api.csproj", "services/Orca.Requests/Orca.Requests.Api/"]
COPY ["services/Orca.Requests/Orca.Requests.Application/Orca.Requests.Application.csproj", "services/Orca.Requests/Orca.Requests.Application/"]
COPY ["services/Orca.Requests/Orca.Requests.Domain/Orca.Requests.Domain.csproj", "services/Orca.Requests/Orca.Requests.Domain/"]
COPY ["services/Orca.Requests/Orca.Requests.Infrastructure/Orca.Requests.Infrastructure.csproj", "services/Orca.Requests/Orca.Requests.Infrastructure/"]
COPY ["services/Orca.SharedContracts/Orca.SharedContracts.csproj", "services/Orca.SharedContracts/"]

RUN dotnet restore "services/Orca.Requests/Orca.Requests.Api/Orca.Requests.Api.csproj"

# Copiar código e compilar
COPY services/Orca.Requests/ services/Orca.Requests/
COPY services/Orca.SharedContracts/ services/Orca.SharedContracts/
WORKDIR "/src/services/Orca.Requests/Orca.Requests.Api"
RUN dotnet build "Orca.Requests.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Orca.Requests.Api.csproj" -c Release -o /app/publish

# Imagem final
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 5004
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Orca.Requests.Api.dll"]