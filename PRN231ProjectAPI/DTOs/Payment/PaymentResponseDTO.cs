namespace PRN231ProjectAPI.DTOs.Payment;

public class PaymentResponseDTO
{
    public Guid Id { get; set; }
    public Guid BookingId { get; set; }
    public string PaymentMethod { get; set; } = null!;
    public decimal Amount { get; set; }
    public string Status { get; set; } = null!;
    public DateTime? CreatedAt { get; set; }
    public string? TransactionRef { get; set; }
}