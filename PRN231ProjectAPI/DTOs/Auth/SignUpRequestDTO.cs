using System.ComponentModel.DataAnnotations;
using PRN231ProjectAPI.Attributes;

namespace PRN231ProjectAPI.DTOs.Auth
{
    public class SignUpRequestDTO
    {
        [Required, MaxLength(100)]
        public string FullName { get; set; }

        [Required, EmailAddress]
        public string Email { get; set; }

        [Required, StrongPassword]
        public string Password { get; set; }
    }
}
