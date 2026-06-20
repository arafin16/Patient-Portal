using Microsoft.EntityFrameworkCore;
using PatientPortal.API;
using Swashbuckle.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddSignalR();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextApp", policy =>
    {
        
        policy.WithOrigins("http://localhost:3000", "https://patient-portal-khaki.vercel.app") 
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials();
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

// 🟢 কন্ডিশন তুলে দিয়ে সবার জন্য সোয়াগার উন্মুক্ত করা হলো (লাইভ সার্ভারের জন্য)
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Patient Portal API v1");
    c.RoutePrefix = "swagger"; 
});

app.UseHttpsRedirection();
app.UseAuthorization();
app.MapControllers();

app.MapHub<PatientPortal.API.Hubs.ChatHub>("/chathub", options =>
{
    options.Transports = Microsoft.AspNetCore.Http.Connections.HttpTransportType.WebSockets | 
                         Microsoft.AspNetCore.Http.Connections.HttpTransportType.LongPolling;
});

app.Run();