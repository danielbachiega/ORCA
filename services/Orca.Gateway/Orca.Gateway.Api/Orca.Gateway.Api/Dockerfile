FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copiar csproj e restaurar dependências
COPY ["services/Orca.Gateway/Orca.Gateway.Api/Orca.Gateway.Api/Orca.Gateway.Api.csproj", "services/Orca.Gateway/Orca.Gateway.Api/Orca.Gateway.Api/"]
RUN dotnet restore "services/Orca.Gateway/Orca.Gateway.Api/Orca.Gateway.Api/Orca.Gateway.Api.csproj"

# Copiar código e compilar
COPY services/Orca.Gateway/Orca.Gateway.Api/Orca.Gateway.Api/ services/Orca.Gateway/Orca.Gateway.Api/Orca.Gateway.Api/
WORKDIR "/src/services/Orca.Gateway/Orca.Gateway.Api/Orca.Gateway.Api"
RUN dotnet build "Orca.Gateway.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Orca.Gateway.Api.csproj" -c Release -o /app/publish

# Imagem final
FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
EXPOSE 5000
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Orca.Gateway.Api.dll"]
