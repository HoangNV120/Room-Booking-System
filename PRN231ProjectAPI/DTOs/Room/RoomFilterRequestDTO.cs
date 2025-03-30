using PRN231ProjectAPI.DTOs.Common;

namespace PRN231ProjectAPI.DTOs.Room
{
    public class RoomFilterRequestDTO : PaginationRequestDTO
    {
        public string? RoomType { get; set; }
        public bool SortDescending { get; set; } = false;
    }
}