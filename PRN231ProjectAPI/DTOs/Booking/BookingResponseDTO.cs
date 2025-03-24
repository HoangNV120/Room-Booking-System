namespace PRN231ProjectAPI.DTOs.Booking;

public class BookingResponseDTO
{
    public Guid Id { get; set; }
    public Guid UserId { get; set; }
    public string UserName { get; set; } = null!;
    public Guid RoomId { get; set; }
    public string RoomType { get; set; } = null!;
    public string HotelName { get; set; } = null!;
    public string HotelAddress { get; set; } = null!;
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
    public decimal TotalPrice { get; set; }
    public string Status { get; set; } = null!;
    public string PaymentStatus { get; set; } = null!;
    public DateTime? CreatedAt { get; set; }
}