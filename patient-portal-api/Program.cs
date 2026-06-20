using Microsoft.EntityFrameworkCore;
using PatientPortal.API;
using Swashbuckle.AspNetCore;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();

// 🟢 ১. SignalR সার্ভিস রেজিস্টার করা
builder.Services.AddSignalR();

builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// 🟢 ২. ফিক্সড CORS পলিসি (SignalR এর জন্য .AllowCredentials() যুক্ত করা হয়েছে)
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowNextApp", policy =>
    {
        policy.WithOrigins("http://localhost:3000") 
              .AllowAnyHeader()
              .AllowAnyMethod()
              .AllowCredentials(); // 👈 এটি অবশ্যই লাগবে, অন্যথায় SignalR কানেক্ট হতে দেবে না
    });
});

builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI(c =>
    {
        c.SwaggerEndpoint("/swagger/v1/swagger.json", "Patient Portal API v1");
    });
}

// ⚠️ এনশিউর করুন HttpsRedirection এর পরেই যেন CORS মিডলওয়্যার থাকে
app.UseHttpsRedirection();

// 🟢 ৩. সঠিক CORS পলিসি অ্যাপ্লাই করা
app.UseCors("AllowNextApp");

app.UseAuthorization();
app.MapControllers();

// 🟢 ৪. চ্যাট হাব এন্ডপয়েন্ট ম্যাপিং
app.MapHub<PatientPortal.API.Hubs.ChatHub>("/chathub");

app.Run();