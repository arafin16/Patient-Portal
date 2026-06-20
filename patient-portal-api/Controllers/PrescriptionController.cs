using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PatientPortal.API.Models;
using PatientPortal.API.DTOs;
using PatientPortal.API;

namespace PatientPortal.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class PrescriptionController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public PrescriptionController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ১. নতুন প্রেসক্রিপশন তৈরি করার এপিআই (ডক্টরের জন্য)
        [HttpPost("create")]
        public async Task<IActionResult> CreatePrescription([FromBody] CreatePrescriptionDto dto)
        {
            // অ্যাপয়েন্টমেন্ট আসলেই এক্সিস্ট করে কিনা চেক করা
            var appointment = await _context.Appointments.FindAsync(dto.AppointmentId);
            if (appointment == null)
            {
                return NotFound(new { message = "Appointment not found." });
            }

            var prescription = new Prescription
            {
                AppointmentId = dto.AppointmentId,
                Medicines = dto.Medicines,
                Advice = dto.Advice,
                CreatedAt = DateTime.UtcNow
            };

            _context.Prescriptions.Add(prescription);
            
            // প্রেসক্রিপশন তৈরি হয়ে গেলে অ্যাপয়েন্টমেন্টের স্ট্যাটাস "Completed" করে দেওয়া ভালো
            appointment.Status = "Completed";

            await _context.SaveChangesAsync();

            return Ok(new { message = "Prescription created and appointment completed successfully!" });
        }

        // ২. নির্দিষ্ট অ্যাপয়েন্টমেন্টের আন্ডারে প্রেসক্রিপশন দেখার এপিআই (পেশেন্ট ও ডক্টর দুজনের জন্য)
        [HttpGet("appointment/{appointmentId}")]
        public async Task<IActionResult> GetPrescriptionByAppointment(int appointmentId)
        {
            var prescription = await _context.Prescriptions
                .Where(p => p.AppointmentId == appointmentId)
                .Select(p => new
                {
                    p.Id,
                    p.AppointmentId,
                    p.Medicines,
                    p.Advice,
                    p.CreatedAt
                })
                .FirstOrDefaultAsync();

            if (prescription == null)
            {
                return NotFound(new { message = "No prescription found for this appointment." });
            }

            return Ok(prescription);
        }
    }
}