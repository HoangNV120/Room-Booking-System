namespace PRN231ProjectAPI.DTOs.Hotel;

public class HotelCreateDTO
{
    public string Name { get; set; } = null!;
    public string Address { get; set; } = null!;
    public string? Description { get; set; }
    public double? Rating { get; set; }
    public IFormFile? Image { get; set; }
}