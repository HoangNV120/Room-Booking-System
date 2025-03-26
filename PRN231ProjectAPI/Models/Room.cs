using System;
using System.Collections.Generic;
using System.Runtime.InteropServices;

namespace PRN231ProjectAPI.Models
{
    public partial class Room
    {
        public Room()
        {
            Bookings = new HashSet<Booking>();
        }
        
        public Guid Id { get; set; }
        public Guid HotelId { get; set; }
        public string RoomName { get; set; } = null!;
        public string RoomType { get; set; } = null!;
        public decimal Price { get; set; }
        public string Status { get; set; } = null!;
        public DateTime? CreatedAt { get; set; }
        public string? ImageUrl { get; set; }

        public virtual Hotel Hotel { get; set; } = null!;
        public virtual ICollection<Booking> Bookings { get; set; }
    }
}
