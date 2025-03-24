namespace PRN231ProjectAPI.DTOs.Booking;

public class BookingFilterDTO
{
    public Guid? UserId { get; set; }
    public DateTime? StartDate { get; set; }
    public DateTime? EndDate { get; set; }
    public string? Status { get; set; }
    public string? PaymentStatus { get; set; }
}