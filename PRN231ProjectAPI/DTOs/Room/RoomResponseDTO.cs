namespace PRN231ProjectAPI.DTOs.Room
{
    public class RoomResponseDTO
    {
        public Guid Id { get; set; }
        public Guid HotelId { get; set; }
        public string HotelName { get; set; } = null!;
        public string RoomType { get; set; } = null!;
        public decimal Price { get; set; }
        public string Status { get; set; } = null!;
        public DateTime? CreatedAt { get; set; }
        public string? ImageUrl { get; set; }
    }
}