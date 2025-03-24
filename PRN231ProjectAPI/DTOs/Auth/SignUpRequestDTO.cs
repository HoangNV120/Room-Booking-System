using System.ComponentModel.DataAnnotations;

namespace PRN231ProjectAPI.DTOs.Auth
{
    public class SignUpRequestDTO
    {
        [Required, MaxLength(100)]
        public string FullName { get; set; }

        [Required, EmailAddress]
        public string Email { get; set; }

        [Required, MinLength(8)]
        public string Password { get; set; }
    }
}
