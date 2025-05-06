FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
ARG BUILD_CONFIGURATION=Release

WORKDIR /src

COPY Lib/Server/ ./Lib/Server/
COPY Preview/Server/ ./Preview/Server/

WORKDIR ./Preview/Server/

RUN dotnet restore ./EchoServer.csproj
RUN dotnet build ./EchoServer.csproj -c $BUILD_CONFIGURATION -o /app/build

FROM build AS publish
ARG BUILD_CONFIGURATION=Release
RUN dotnet publish ./EchoServer.csproj -c $BUILD_CONFIGURATION -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app/bin/Release
COPY --from=publish /app/publish .
EXPOSE 8080
EXPOSE 8081
ENTRYPOINT ["dotnet", "EchoServer.dll"]
