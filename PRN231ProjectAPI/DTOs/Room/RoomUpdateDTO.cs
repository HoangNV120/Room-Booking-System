namespace PRN231ProjectAPI.DTOs.Room;

public class RoomUpdateDTO
{
    public Guid? HotelId { get; set; }
    public string? RoomName { get; set; }
    public string? RoomType { get; set; }
    public decimal? Price { get; set; }
    public string? Status { get; set; }
    public IFormFile? Image { get; set; }
}