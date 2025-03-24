using System;
using System.Collections.Generic;

namespace PRN231ProjectAPI.Models
{
    public partial class Hotel
    {
        public Hotel()
        {
            Rooms = new HashSet<Room>();
        }

        public Guid Id { get; set; }
        public string Name { get; set; } = null!;
        public string Address { get; set; } = null!;
        public string? Description { get; set; }
        public double? Rating { get; set; }
        public DateTime? CreatedAt { get; set; }

        public virtual ICollection<Room> Rooms { get; set; }
    }
}
