using System;
using System.Collections.Generic;

namespace PRN231ProjectAPI.Models
{
    public partial class User
    {
        public User()
        {
            Bookings = new HashSet<Booking>();
        }

        public Guid Id { get; set; }
        public string FullName { get; set; } = null!;
        public string Email { get; set; } = null!;
        public string PasswordHash { get; set; } = null!;
        public string Role { get; set; } = null!;
        public DateTime? CreatedAt { get; set; }

        public virtual ICollection<Booking> Bookings { get; set; }
    }
}
