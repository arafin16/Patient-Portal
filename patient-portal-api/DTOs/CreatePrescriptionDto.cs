using System.ComponentModel.DataAnnotations;

namespace PatientPortal.API.DTOs
{
    public class CreatePrescriptionDto
    {
        [Required]
        public int AppointmentId { get; set; }

        [Required]
        public string Medicines { get; set; } = string.Empty;

        [Required]
        public string Advice { get; set; } = string.Empty;
    }
}