﻿namespace PRN231ProjectAPI.DTOs.Auth
{
    public class LoginResponseDto
    {
        public string AccessToken { get; set; } = string.Empty;
        public string RefreshToken { get; set; } = string.Empty;
        public int ExpiresIn { get; set; }
        public Guid UserId { get; set; } = Guid.Empty;
    }

}
