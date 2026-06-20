using System.ComponentModel.DataAnnotations;
using PatientPortal.API.Models;

namespace PatientPortal.API.DTOs
{
    public class RegisterDto
    {
        [Required]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        [MinLength(6, ErrorMessage = "Password must be at least 6 characters long.")]
        public string Password { get; set; } = string.Empty;

        [Required]
        public UserRole Role { get; set; } // 0 = Patient, 1 = Doctor, 2 = Admin
    }
}