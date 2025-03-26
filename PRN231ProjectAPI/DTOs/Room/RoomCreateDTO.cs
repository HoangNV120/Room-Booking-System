namespace PRN231ProjectAPI.DTOs.Room;

public class RoomCreateDTO
{
    public Guid HotelId { get; set; }
    public string RoomName { get; set; } = null!;
    public string RoomType { get; set; } = null!;
    public decimal Price { get; set; }
    public string Status { get; set; } = "Available";
    public IFormFile? Image { get; set; }
}