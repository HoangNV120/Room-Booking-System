using System.ComponentModel.DataAnnotations;
using PRN231ProjectAPI.Attributes;

namespace PRN231ProjectAPI.DTOs.Auth;

public class ResetPasswordRequestDTO
{
    [Required]
    [EmailAddress]
    public string Email { get; set; } = null!;
        
    [Required]
    public string Code { get; set; } = null!;
        
    [Required]
    [StrongPassword]
    public string NewPassword { get; set; } = null!;
        
    [Required]
    [Compare("NewPassword")]
    public string ConfirmPassword { get; set; } = null!;
}