namespace PRN231ProjectAPI.DTOs.Payment;

public class VnPayPaymentResponseDTO
{
    public string PaymentUrl { get; set; } = null!;
    public Guid PaymentId { get; set; }
}