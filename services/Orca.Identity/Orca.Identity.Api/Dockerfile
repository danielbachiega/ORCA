FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY ["services/Orca.Identity/Orca.Identity.Api/Orca.Identity.Api.csproj", "services/Orca.Identity/Orca.Identity.Api/"]
COPY ["services/Orca.Identity/Orca.Identity.Application/Orca.Identity.Application.csproj", "services/Orca.Identity/Orca.Identity.Application/"]
COPY ["services/Orca.Identity/Orca.Identity.Domain/Orca.Identity.Domain.csproj", "services/Orca.Identity/Orca.Identity.Domain/"]
COPY ["services/Orca.Identity/Orca.Identity.Infrastructure/Orca.Identity.Infrastructure.csproj", "services/Orca.Identity/Orca.Identity.Infrastructure/"]

RUN dotnet restore "services/Orca.Identity/Orca.Identity.Api/Orca.Identity.Api.csproj"

COPY . .
WORKDIR "/src/services/Orca.Identity/Orca.Identity.Api"
RUN dotnet build "Orca.Identity.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "Orca.Identity.Api.csproj" -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS final
WORKDIR /app
ARG http_proxy
ARG https_proxy
ARG no_proxy
ARG APT_MIRROR=deb.debian.org
ARG APT_SECURITY_MIRROR=security.debian.org
ENV http_proxy=$http_proxy
ENV https_proxy=$https_proxy
ENV no_proxy=$no_proxy
RUN if [ -f /etc/apt/sources.list ]; then \
		sed -i "s|http://deb.debian.org/debian|https://$APT_MIRROR/debian|g" /etc/apt/sources.list; \
		sed -i "s|http://deb.debian.org/debian-security|https://$APT_SECURITY_MIRROR/debian-security|g" /etc/apt/sources.list; \
	elif [ -f /etc/apt/sources.list.d/debian.sources ]; then \
		sed -i "s|http://deb.debian.org/debian|https://$APT_MIRROR/debian|g" /etc/apt/sources.list.d/debian.sources; \
		sed -i "s|http://deb.debian.org/debian-security|https://$APT_SECURITY_MIRROR/debian-security|g" /etc/apt/sources.list.d/debian.sources; \
	fi \
	&& apt-get update \
	&& apt-get install -y --no-install-recommends libldap-2.5-0 \
	&& rm -rf /var/lib/apt/lists/*
ARG Ldap__LocalSuperAdminPassword
ARG Ldap__LocalAdminPassword
ARG Ldap__UseMockMode
ARG Ldap__Host
ARG Ldap__Port
ARG Ldap__BaseDn
ARG Ldap__Domain
ARG Ldap__ServiceAccountDn
ARG Ldap__ServiceAccountPassword
ARG Ldap__UseSsl
ARG Ldap__TimeoutSeconds
ARG Ldap__UsernameAttribute
ARG Ldap__EmailAttribute
ARG Ldap__GroupAttribute
ENV Ldap__UseMockMode=${Ldap__UseMockMode}
ENV Ldap__Host=${Ldap__Host}
ENV Ldap__Port=${Ldap__Port}
ENV Ldap__BaseDn=${Ldap__BaseDn}
ENV Ldap__Domain=${Ldap__Domain}
ENV Ldap__ServiceAccountDn=${Ldap__ServiceAccountDn}
ENV Ldap__ServiceAccountPassword=${Ldap__ServiceAccountPassword}
ENV Ldap__UseSsl=${Ldap__UseSsl}
ENV Ldap__TimeoutSeconds=${Ldap__TimeoutSeconds}
ENV Ldap__UsernameAttribute=${Ldap__UsernameAttribute}
ENV Ldap__EmailAttribute=${Ldap__EmailAttribute}
ENV Ldap__GroupAttribute=${Ldap__GroupAttribute}
ENV Ldap__LocalSuperAdminPassword=${Ldap__LocalSuperAdminPassword}
ENV Ldap__LocalAdminPassword=${Ldap__LocalAdminPassword}
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "Orca.Identity.Api.dll"]
