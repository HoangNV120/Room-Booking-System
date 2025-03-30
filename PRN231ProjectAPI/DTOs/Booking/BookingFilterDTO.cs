using PRN231ProjectAPI.DTOs.Common;

namespace PRN231ProjectAPI.DTOs.Booking;

public class BookingFilterDTO : PaginationRequestDTO
{
    public Guid? UserId { get; set; }
    public bool? StartDateOrder { get; set; } // true = ascending, false = descending
    public bool? EndDateOrder { get; set; } // true = ascending, false = descending
    public string? Status { get; set; }
    public string? PaymentStatus { get; set; }
}