namespace PRN231ProjectAPI.DTOs.Room
{
    public class RoomResponseDTO
    {
        public Guid Id { get; set; }
        public Guid HotelId { get; set; }
        public string HotelName { get; set; }
        public string RoomType { get; set; }
        public decimal Price { get; set; }
        public string Status { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}