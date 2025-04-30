using EchoServer;
using Newtonsoft.Json;

var builder = WebApplication.CreateBuilder(args);
builder.Services.AddControllers();
builder.Services.AddSignalR(o =>
{
    o.EnableDetailedErrors = true;
    o.MaximumReceiveMessageSize = int.MaxValue;
}).AddNewtonsoftJsonProtocol();

builder.Services.AddCors(o =>
    o.AddPolicy("cors", config =>
        config.AllowAnyHeader()
            .AllowAnyMethod()
            .AllowCredentials()
            .WithOrigins("http://localhost:5500", "http://127.0.0.1:5500")
            .SetIsOriginAllowed((host) => true)
            .SetIsOriginAllowedToAllowWildcardSubdomains()
    )
);

var app = builder.Build();
app.UseCors("cors");
app.MapHub<BrowserHub>("/hub").AllowAnonymous();
app.UseHttpsRedirection();
app.Run();