using System;

namespace PatientPortal.API.Models
{
    public class Message
    {
        public int Id { get; set; }
        public int SenderId { get; set; } // যে মেসেজ পাঠাচ্ছে (Patient বা Doctor)
        public int ReceiverId { get; set; } // যে মেসেজ পাচ্ছে
        public string Content { get; set; } = string.Empty; // মেসেজের টেক্সট বা প্রেসক্রিপশন লিংক
        public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    }
}