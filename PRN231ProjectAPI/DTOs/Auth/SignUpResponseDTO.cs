namespace PRN231ProjectAPI.DTOs.Auth
{
    public class SignUpResponseDTO
    {
        public Guid Id { get; set; }
        public string Email { get; set; }
        public string FullName { get; set; }
        public string Role { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}