namespace PRN231ProjectAPI.DTOs.Room;

public class AvailabilityRequestDTO
{
    public DateTime CheckIn { get; set; }
    public DateTime CheckOut { get; set; }
    public string? RoomType { get; set; }
    public decimal? MaxPrice { get; set; }
}