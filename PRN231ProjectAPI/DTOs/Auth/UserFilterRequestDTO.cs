using PRN231ProjectAPI.DTOs.Common;

namespace PRN231ProjectAPI.DTOs.Auth
{
    public class UserFilterRequestDTO : PaginationRequestDTO
    {
        public string? FullName { get; set; }
        public string? Email { get; set; }
        public string? Role { get; set; }
        public string SortOrder { get; set; } = "desc"; // "asc" or "desc" for creation date
    }
}