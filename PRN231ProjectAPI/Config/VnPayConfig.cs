﻿namespace PRN231ProjectAPI.Config;

public class VnPayConfig
{
    public string Version { get; set; }
    public string TmnCode { get; set; }
    public string HashSecret { get; set; }
    public string PaymentUrl { get; set; }
    public string ReturnUrl { get; set; }
}