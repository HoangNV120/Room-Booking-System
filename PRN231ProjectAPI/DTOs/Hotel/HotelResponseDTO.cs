namespace PRN231ProjectAPI.DTOs.Hotel;

public class HotelResponseDTO
{
    public Guid Id { get; set; }
    public string Name { get; set; } = null!;
    public string Address { get; set; } = null!;
    public string? Description { get; set; }
    public double? Rating { get; set; }
    public DateTime? CreatedAt { get; set; }
    public string? ImageUrl { get; set; }
}