using Microsoft.AspNetCore.SignalR;
using System.Threading.Tasks;

namespace PatientPortal.API.Hubs
{
    public class ChatHub : Hub
    {
        // ডক্টর বা পেশেন্ট যখন চ্যাটে মেসেজ পাঠাবে, এই মেথডটি লাইভ ট্রিগার হবে
        public async Task SendMessage(string senderId, string receiverId, string message)
        {
            // নির্দিষ্ট রিসিভারের কাছে মেসেজটি লাইভ পুশ করে দেওয়া হবে
            await Clients.All.SendAsync("ReceiveMessage", senderId, message);
        }
    }
}