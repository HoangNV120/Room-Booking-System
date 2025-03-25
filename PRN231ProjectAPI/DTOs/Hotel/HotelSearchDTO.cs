using PRN231ProjectAPI.DTOs.Common;

namespace PRN231ProjectAPI.DTOs.Hotel;

public class HotelSearchDTO : PaginationRequestDTO
{
    // Name search parameter
    public string? NameSearch { get; set; }
    
    // Rating sort direction (true = descending/highest first, false = ascending/lowest first)
    public bool SortDescending { get; set; } = true;
}