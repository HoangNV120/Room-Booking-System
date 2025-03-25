using PRN231ProjectAPI.DTOs.Common;

namespace PRN231ProjectAPI.DTOs.Room
{
    public class RoomFilterRequestDTO : PaginationRequestDTO
    {
        // Optional room type filter
        public string? RoomType { get; set; }
        
        // Price sort direction (true = descending/highest first, false = ascending/lowest first)
        public bool SortDescending { get; set; } = false;
    }
}