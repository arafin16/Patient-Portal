using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PatientPortal.API.Models;
using System.Threading.Tasks;
using System.Linq;

namespace PatientPortal.API.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class ChatController : ControllerBase
    {
        private readonly ApplicationDbContext _context;

        public ChatController(ApplicationDbContext context)
        {
            _context = context;
        }

        // ১. দুজন ইউজারের (পেশেন্ট ও ডক্টর) মধ্যকার আগের সব মেসেজ লোড করা
        [HttpGet("history/{userId}/{contactId}")]
        public async Task<IActionResult> GetChatHistory(int userId, int contactId)
        {
            var messages = await _context.Messages
                .Where(m => (m.SenderId == userId && m.ReceiverId == contactId) || 
                            (m.SenderId == contactId && m.ReceiverId == userId))
                .OrderBy(m => m.Timestamp)
                .ToListAsync();

            return Ok(messages);
        }

        // ২. নতুন মেসেজ ডাটাবেজে সেভ করা
        [HttpPost("send")]
        public async Task<IActionResult> SaveMessage([FromBody] Message message)
        {
            _context.Messages.Add(message);
            await _context.SaveChangesAsync();
            return Ok(message);
        }
    }
}