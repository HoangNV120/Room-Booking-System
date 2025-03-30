using System.ComponentModel.DataAnnotations;

namespace PRN231ProjectAPI.DTOs.Auth
{
    public class LoginRequestDTO
    {
        [Required, EmailAddress]
        public string Email { get; set; }

        [Required, MinLength(8)]
        public string Password { get; set; }
        
        [Required]
        public string TurnstileToken { get; set; }
    }
}
