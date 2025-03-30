namespace PRN231ProjectAPI.DTOs.Hotel;

public class HotelUpdateDTO
{
    public string? Name { get; set; }
    public string? Address { get; set; }
    public string? Description { get; set; }
    public double? Rating { get; set; }
    public IFormFile? Image { get; set; }
}