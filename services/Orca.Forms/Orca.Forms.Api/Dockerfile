FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["services/Orca.Forms/Orca.Forms.Api/Orca.Forms.Api.csproj", "services/Orca.Forms/Orca.Forms.Api/"]
COPY ["services/Orca.Forms/Orca.Forms.Application/Orca.Forms.Application.csproj", "services/Orca.Forms/Orca.Forms.Application/"]
COPY ["services/Orca.Forms/Orca.Forms.Domain/Orca.Forms.Domain.csproj", "services/Orca.Forms/Orca.Forms.Domain/"]
COPY ["services/Orca.Forms/Orca.Forms.Infrastructure/Orca.Forms.Infrastructure.csproj", "services/Orca.Forms/Orca.Forms.Infrastructure/"]
COPY ["shared/Orca.Shared/Orca.Shared.Domain/Orca.Shared.Domain/Orca.Shared.Domain.csproj", "shared/Orca.Shared/Orca.Shared.Domain/Orca.Shared.Domain/"]
COPY ["shared/Orca.Shared/Orca.Shared.Events/Orca.Shared.Events/Orca.Shared.Events.csproj", "shared/Orca.Shared/Orca.Shared.Events/Orca.Shared.Events/"]
COPY ["shared/Orca.Shared/Orca.Shared.Contracts/Orca.Shared.Contracts/Orca.Shared.Contracts.csproj", "shared/Orca.Shared/Orca.Shared.Contracts/Orca.Shared.Contracts/"]

RUN dotnet restore "services/Orca.Forms/Orca.Forms.Api/Orca.Forms.Api.csproj"

COPY . .
WORKDIR "/src/services/Orca.Forms/Orca.Forms.Api"
RUN dotnet build "Orca.Forms.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Orca.Forms.Api.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Orca.Forms.Api.dll"]
