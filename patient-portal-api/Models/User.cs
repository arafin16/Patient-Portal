using System.ComponentModel.DataAnnotations;

namespace PatientPortal.API.Models
{
    public class User
    {
        [Key]
        public int Id { get; set; }

        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        [Required]
        public UserRole Role { get; set; }

        // ডক্টরদের ক্ষেত্রে শুরুতে false থাকবে, অ্যাডমিন true করে দিলে লগইন করতে পারবে
        // পেশেন্ট বা অ্যাডমিনের জন্য ডিফল্টভাবে true থাকবে
        public bool IsApproved { get; set; } = true; 

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}