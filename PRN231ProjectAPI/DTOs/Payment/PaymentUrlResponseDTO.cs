namespace PRN231ProjectAPI.DTOs.Payment
{
    public class PaymentUrlResponseDTO
    {
        public string PaymentUrl { get; set; } = null!;
        public DateTime ExpiresAt { get; set; }
    }
}