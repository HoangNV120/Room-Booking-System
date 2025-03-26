using System.ComponentModel.DataAnnotations;

namespace PRN231ProjectAPI.DTOs.Auth
{
    public class VerificationRequestDTO
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; }
        
        [Required]
        public string Code { get; set; }
    }
}