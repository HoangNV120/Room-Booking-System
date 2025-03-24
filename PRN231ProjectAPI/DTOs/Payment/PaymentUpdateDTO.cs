namespace PRN231ProjectAPI.DTOs.Payment;

public class PaymentUpdateDTO
{
    public string Status { get; set; } = null!;
    public string? TransactionRef { get; set; }
}