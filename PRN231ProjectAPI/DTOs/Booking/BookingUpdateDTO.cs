namespace PRN231ProjectAPI.DTOs.Booking;

public class BookingUpdateDTO
{
    public DateTime? CheckInDate { get; set; }
    public DateTime? CheckOutDate { get; set; }
    public string? Status { get; set; }
    public string? PaymentStatus { get; set; }
}