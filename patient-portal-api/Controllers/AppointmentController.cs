using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PatientPortal.API.Models;
using PatientPortal.API.DTOs;
using PatientPortal.API;

namespace PatientPortal.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class AppointmentController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public AppointmentController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ১. নতুন অ্যাপয়েন্টমেন্ট বুক করার এপিআই (পেশেন্টের জন্য)
        [HttpPost("book")]
        public async Task<IActionResult> BookAppointment([FromBody] AppointmentDto dto)
        {
            var doctorExists = await _context.Users.AnyAsync(u => u.Id == dto.DoctorId && u.Role == UserRole.Doctor);
            if (!doctorExists)
            {
                return BadRequest(new { message = "Selected doctor does not exist." });
            }

            var appointment = new Appointment
            {
                PatientId = dto.PatientId,
                DoctorId = dto.DoctorId,
                AppointmentDate = dto.AppointmentDate,
                Status = "Pending"
            };

            _context.Appointments.Add(appointment);
            await _context.SaveChangesAsync();

            return Ok(new { message = "Appointment booked successfully!" });
        }

        // ২. কোনো নির্দিষ্ট পেশেন্টের সব অ্যাপয়েন্টমেন্ট দেখা
        [HttpGet("patient/{patientId}")]
        public async Task<IActionResult> GetPatientAppointments(int patientId)
        {
            var appointments = await _context.Appointments
                .Where(a => a.PatientId == patientId)
                .Include(a => a.Doctor)
                .Select(a => new
                {
                    a.Id,
                    a.DoctorId, // 🟢 চ্যাটের জন্য ফ্রন্টএন্ডে আইডি রিটার্ন করা হলো
                    DoctorName = a.Doctor != null ? a.Doctor.Name : null,
                    a.AppointmentDate,
                    a.Status
                })
                .ToListAsync();

            return Ok(appointments);
        }

        // ৩. কোনো নির্দিষ্ট ডক্টরের সব অ্যাপয়েন্টমেন্ট দেখা (ফিক্সড ওল্ড পেশেন্ট লিস্ট)
        [HttpGet("doctor/{doctorId}")]
        public async Task<IActionResult> GetDoctorAppointments(int doctorId)
        {
            var appointments = await _context.Appointments
                .Where(a => a.DoctorId == doctorId)
                .Include(a => a.Patient)
                .Select(a => new
                {
                    a.Id,
                    a.PatientId, // 🟢 চ্যাটের জন্য ফ্রন্টএন্ডে আইডি রিটার্ন করা হলো যা আগে মিসিং ছিল
                    PatientName = a.Patient != null ? a.Patient.Name : null,
                    a.AppointmentDate,
                    a.Status
                })
                .ToListAsync();

            return Ok(appointments);
        }

        // ৪. ডক্টরের অ্যাপয়েন্টমেন্ট অ্যাপ্রুভ বা ক্যান্সেল করার এপিআই
        [HttpPut("update-status/{id}")]
        public async Task<IActionResult> UpdateStatus(int id, [FromBody] StatusUpdateDto dto)
        {
            var appointment = await _context.Appointments.FindAsync(id);
            if (appointment == null)
            {
                return NotFound(new { message = "Appointment not found!" });
            }

            // ডিটিও থেকে ভ্যালু নেওয়া হচ্ছে যেন ফ্রন্টএন্ড অবজেক্ট বাইন্ড করতে পারে
            if (dto.Status != "Approved" && dto.Status != "Cancelled" && dto.Status != "Completed")
            {
                return BadRequest(new { message = "Invalid status value. Use Approved, Cancelled or Completed" });
            }

            appointment.Status = dto.Status;
            await _context.SaveChangesAsync();

            return Ok(new { message = $"Appointment has been {dto.Status} successfully." });
        }
    }

    // 🟢 স্ট্যাটাস রিকোয়েস্ট বাইন্ডিং অবজেক্ট ডিটিও
    public class StatusUpdateDto
    {
        public string Status { get; set; } = string.Empty;
    }
}