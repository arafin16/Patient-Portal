using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PatientPortal.API.Models
{
    public class Appointment
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int PatientId { get; set; }
        
        [ForeignKey("PatientId")]
        public User? Patient { get; set; } // Foreign Key Relation to User Table

        [Required]
        public int DoctorId { get; set; }

        [ForeignKey("DoctorId")]
        public User? Doctor { get; set; } // Foreign Key Relation to User Table

        [Required]
        public DateTime AppointmentDate { get; set; }

        [Required]
        [StringLength(50)]
        public string TimeSlot { get; set; } = string.Empty; // যেমন: "10:00 AM - 10:30 AM"

        [Required]
        public string Status { get; set; } = "Pending"; // Pending, Approved, Rejected

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}