using System;
using System.Collections.Generic;

namespace PRN231ProjectAPI.Models
{
    public partial class Booking
    {
        public Booking()
        {
            Payments = new HashSet<Payment>();
        }

        public Guid Id { get; set; }
        public Guid UserId { get; set; }
        public Guid RoomId { get; set; }
        public DateTime CheckInDate { get; set; }
        public DateTime CheckOutDate { get; set; }
        public decimal TotalPrice { get; set; }
        public string Status { get; set; } = null!;
        public string PaymentStatus { get; set; } = null!;
        public DateTime? CreatedAt { get; set; }

        public virtual Room Room { get; set; } = null!;
        public virtual User User { get; set; } = null!;
        public virtual ICollection<Payment> Payments { get; set; }
    }
}
