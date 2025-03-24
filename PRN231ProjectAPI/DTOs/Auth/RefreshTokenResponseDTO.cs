namespace PRN231ProjectAPI.DTOs.Auth
{
    public class RefreshTokenResponseDTO
    {
        public string AccessToken { get; set; }
        public string RefreshToken { get; set; }
        public int Expiration { get; set; }
    }

}
