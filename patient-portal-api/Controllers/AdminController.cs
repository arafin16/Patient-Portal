using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PatientPortal.API.Models;
using PatientPortal.API;

namespace PatientPortal.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AdminController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AdminController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ১. সব ডক্টরদের লিস্ট দেখা (Approved এবং Pending দুটোই)
        [HttpGet("doctors")]
        public async Task<IActionResult> GetDoctors()
        {
            var doctors = await _context.Users
                .Where(u => u.Role == UserRole.Doctor)
                .Select(u => new
                {
                    u.Id,
                    u.Name,
                    u.Email,
                    u.IsApproved
                })
                .ToListAsync();

            return Ok(doctors);
        }

        // ২. ডক্টর অ্যাকাউন্ট অ্যাপ্রুভ বা স্ট্যাটাস চেঞ্জ করার এপিআই
        [HttpPut("approve-doctor/{id}")]
        public async Task<IActionResult> ApproveDoctor(int id, [FromBody] bool isApproved)
        {
            var doctor = await _context.Users
                .FirstOrDefaultAsync(u => u.Id == id && u.Role == UserRole.Doctor);

            if (doctor == null)
            {
                return NotFound(new { message = "Doctor not found!" });
            }

            doctor.IsApproved = isApproved;
            await _context.SaveChangesAsync();

            string status = isApproved ? "approved" : "disapproved";
            return Ok(new { message = $"Doctor account has been successfully {status}." });
        }

        // ৩. ড্যাশবোর্ড অ্যানালিটিক্স এপিআই (রিয়েল-টাইম চার্ট ডাটা)
        [HttpGet("analytics")]
        public async Task<IActionResult> GetAnalytics()
        {
            // ক. ডাটাবেজ থেকে রিয়েল-টাইম কাউন্ট নেওয়া
            var totalDoctors = await _context.Users.CountAsync(u => u.Role == UserRole.Doctor);
            var approvedDoctors = await _context.Users.CountAsync(u => u.Role == UserRole.Doctor && u.IsApproved == true);
            var pendingDoctors = await _context.Users.CountAsync(u => u.Role == UserRole.Doctor && u.IsApproved == false);
            var totalAppointments = await _context.Appointments.CountAsync();

            // খ. টপ অ্যাপয়েন্টমেন্ট পাওয়া ডাক্তারদের ডেটা (সাময়িক ফিক্সড)
            var topDoctorsRaw = await _context.Users
                .Where(u => u.Role == UserRole.Doctor)
                .Select(u => new
                {
                    u.Name,
                    Appointments = 0 
                })
                .Take(5)
                .ToListAsync();

            var topDoctors = topDoctorsRaw.Select(x => new {
                name = "Dr. " + x.Name,
                Appointments = x.Appointments
            }).ToList();

            // গ. গত ৬ মাসের আসল রেজিস্ট্রেশন ট্রেন্ড (পেশেন্ট ও ডক্টর)
            var sixMonthsAgo = DateTime.UtcNow.AddMonths(-6);
            var monthlyData = await _context.Users
                .Where(u => u.CreatedAt >= sixMonthsAgo)
                .GroupBy(u => new { Month = u.CreatedAt.Month, Role = u.Role })
                .Select(g => new { g.Key.Month, g.Key.Role, Count = g.Count() })
                .ToListAsync();

            string[] monthNames = { "", "Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec" };
            
            var chartData = monthlyData
                .GroupBy(m => m.Month)
                .Select(g => new {
                    name = monthNames[g.Key],
                    Patients = g.Where(x => x.Role == UserRole.Patient).Sum(x => x.Count),
                    Doctors = g.Where(x => x.Role == UserRole.Doctor).Sum(x => x.Count),
                    MonthOrder = g.Key 
                })
                .OrderBy(x => x.MonthOrder)
                .Select(x => new { x.name, x.Patients, x.Doctors }) 
                .ToList();

            return Ok(new {
                totalApplications = totalDoctors,
                approvedDoctors = approvedDoctors,
                pendingApprovals = pendingDoctors,
                totalAppointments = totalAppointments,
                topDoctors = topDoctors,
                monthlyTrend = chartData
            });
        }
    }
}