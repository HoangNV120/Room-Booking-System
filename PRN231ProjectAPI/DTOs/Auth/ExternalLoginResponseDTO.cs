namespace PRN231ProjectAPI.DTOs.Auth;

public class ExternalLoginResponseDTO : LoginResponseDto
{
    public bool IsNewUser { get; set; }
}
