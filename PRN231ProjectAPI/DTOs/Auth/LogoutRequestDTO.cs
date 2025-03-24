using System.ComponentModel.DataAnnotations;

namespace PRN231ProjectAPI.DTOs.Auth
{
    public class LogoutRequestDTO
    {
        [Required]
        public string UserId { get; set; }
        [Required]
        public string RefreshToken { get; set; }
    }
}
