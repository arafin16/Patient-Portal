using System;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace PatientPortal.API.Models
{
    public class Prescription
    {
        [Key]
        public int Id { get; set; }

        [Required]
        public int AppointmentId { get; set; }
        
        [ForeignKey("AppointmentId")]
        public Appointment? Appointment { get; set; }

        [Required]
        public string Medicines { get; set; } = string.Empty; // যেমন: "Napa 500mg (1+0+1)"

        [Required]
        public string Advice { get; set; } = string.Empty; // যেমন: "Rest for 3 days"

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}