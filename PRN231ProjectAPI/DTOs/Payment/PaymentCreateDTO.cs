namespace PRN231ProjectAPI.DTOs.Payment;

public class PaymentCreateDTO
{
    public Guid BookingId { get; set; }
    public string PaymentMethod { get; set; } = null!;
    public string? ReturnUrl { get; set; }
}