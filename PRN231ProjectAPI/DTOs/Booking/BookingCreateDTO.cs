namespace PRN231ProjectAPI.DTOs.Booking;

public class BookingCreateDTO
{
    public Guid UserId { get; set; }
    public Guid RoomId { get; set; }
    public DateTime CheckInDate { get; set; }
    public DateTime CheckOutDate { get; set; }
}