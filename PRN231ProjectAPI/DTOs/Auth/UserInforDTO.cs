namespace PRN231ProjectAPI.DTOs.Auth
{
    public class UserInfoDTO
    {
        public Guid Id { get; set; }
        public string FullName { get; set; }
        public string Email { get; set; }
        public string Role { get; set; }
        public bool IsExternalLogin { get; set; }
        public DateTime? CreatedAt { get; set; }
    }
}