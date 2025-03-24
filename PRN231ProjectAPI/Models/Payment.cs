using System;
using System.Collections.Generic;

namespace PRN231ProjectAPI.Models
{
    public partial class Payment
    {
        public Guid Id { get; set; }
        public Guid BookingId { get; set; }
        public string PaymentMethod { get; set; } = null!;
        public decimal Amount { get; set; }
        public string Status { get; set; } = null!;
        public DateTime? CreatedAt { get; set; }
        public DateTime? ExpiresAt { get; set; } 

        public virtual Booking Booking { get; set; } = null!;
    }
}
