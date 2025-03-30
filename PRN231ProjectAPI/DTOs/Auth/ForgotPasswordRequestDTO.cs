using System.ComponentModel.DataAnnotations;

namespace PRN231ProjectAPI.DTOs.Auth;

public class ForgotPasswordRequestDTO
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = null!;
        
    public string? TurnstileToken { get; set; }
}