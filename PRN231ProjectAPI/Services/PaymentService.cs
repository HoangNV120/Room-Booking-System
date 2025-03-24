using PRN231ProjectAPI.DTOs.Payment;
using PRN231ProjectAPI.Exceptions;
using PRN231ProjectAPI.Models;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PRN231ProjectAPI.DTOs.Payment;
using PRN231ProjectAPI.Exceptions;
using PRN231ProjectAPI.Models;
using System.Globalization;
using System.Net;
using System.Security.Cryptography;
using System.Text;

namespace PRN231ProjectAPI.Services
{
    public class PaymentService
    {
        private readonly HotelBookingDBContext _context;
        private readonly IMapper _mapper;
        private readonly VnPayConfig _vnPayConfig;
        private readonly IHttpContextAccessor _httpContextAccessor;

        public PaymentService(
            HotelBookingDBContext context, 
            IMapper mapper,
            IOptions<VnPayConfig> vnPayConfig,
            IHttpContextAccessor httpContextAccessor)
        {
            _context = context;
            _mapper = mapper;
            _vnPayConfig = vnPayConfig.Value;
            _httpContextAccessor = httpContextAccessor;
        }

        public async Task<IEnumerable<PaymentResponseDTO>> GetPaymentsByBookingId(Guid bookingId)
        {
            var payments = await _context.Payments
                .Where(p => p.BookingId == bookingId)
                .ToListAsync();

            return _mapper.Map<List<PaymentResponseDTO>>(payments);
        }

        public async Task<PaymentResponseDTO> GetPaymentById(Guid id)
        {
            var payment = await _context.Payments.FindAsync(id);

            if (payment == null)
                throw new NotFoundException($"Payment with ID {id} not found");

            return _mapper.Map<PaymentResponseDTO>(payment);
        }

        public async Task<VnPayPaymentResponseDTO> CreateVnPayPayment(PaymentCreateDTO request)
        {
            // Validate booking exists and is pending payment
            var booking = await _context.Bookings
                .Include(b => b.Room)
                .FirstOrDefaultAsync(b => b.Id == request.BookingId);

            if (booking == null)
                throw new NotFoundException($"Booking with ID {request.BookingId} not found");

            if (booking.PaymentStatus == "Paid")
                throw new ConflictException("This booking has already been paid");

            // Create payment record
            var payment = new Payment
            {
                Id = Guid.NewGuid(),
                BookingId = request.BookingId,
                PaymentMethod = request.PaymentMethod,
                Amount = booking.TotalPrice,
                Status = "Pending",
                CreatedAt = DateTime.UtcNow
            };

            _context.Payments.Add(payment);
            await _context.SaveChangesAsync();

            // If payment method is VnPay, create payment URL
            if (request.PaymentMethod.ToLower() == "vnpay")
            {
                var paymentUrl = CreateVnPayUrl(payment, booking, request.ReturnUrl);
                return new VnPayPaymentResponseDTO
                {
                    PaymentUrl = paymentUrl,
                    PaymentId = payment.Id
                };
            }

            throw new BadRequestException("Unsupported payment method");
        }

        public async Task<PaymentResponseDTO> ProcessVnPayCallback(PaymentCallbackRequestDTO request)
        {
            // Validate VnPay response
            var isValidSignature = ValidateVnPaySignature(request);
            if (!isValidSignature)
                throw new BadRequestException("Invalid payment signature");

            // Find payment by transaction reference
            var paymentId = Guid.Parse(request.vnp_TxnRef);
            var payment = await _context.Payments.FindAsync(paymentId);

            if (payment == null)
                throw new NotFoundException($"Payment with ID {paymentId} not found");

            // Update payment status based on VnPay response
            if (request.vnp_ResponseCode == "00" && request.vnp_TransactionStatus == "00")
            {
                payment.Status = "Success";
                
                // Update booking payment status
                var booking = await _context.Bookings.FindAsync(payment.BookingId);
                if (booking != null)
                {
                    booking.PaymentStatus = "Paid";
                    booking.Status = "Confirmed";
                }
            }
            else
            {
                payment.Status = "Failed";
            }

            // Save transaction reference from VnPay
            var paymentExtra = new
            {
                TransactionRef = request.vnp_TransactionNo,
                BankCode = request.vnp_BankCode,
                BankTranNo = request.vnp_BankTranNo,
                PayDate = request.vnp_PayDate,
                CardType = request.vnp_CardType
            };

            await _context.SaveChangesAsync();

            return _mapper.Map<PaymentResponseDTO>(payment);
        }

        private string CreateVnPayUrl(Payment payment, Booking booking, string? customerReturnUrl)
        {
            var returnUrl = !string.IsNullOrEmpty(customerReturnUrl) 
                ? customerReturnUrl 
                : _vnPayConfig.ReturnUrl;

            var expiryTime = DateTime.Now.AddMinutes(15);
            payment.ExpiresAt = expiryTime;
            
            var vnpay = new VnPayLibrary();
            vnpay.AddRequestData("vnp_Version", _vnPayConfig.Version);
            vnpay.AddRequestData("vnp_Command", "pay");
            vnpay.AddRequestData("vnp_TmnCode", _vnPayConfig.TmnCode);
            vnpay.AddRequestData("vnp_Amount", ((long)(booking.TotalPrice * 100)).ToString());
            vnpay.AddRequestData("vnp_CreateDate", DateTime.Now.ToString("yyyyMMddHHmmss"));
            vnpay.AddRequestData("vnp_CurrCode", "VND");
            vnpay.AddRequestData("vnp_IpAddr", GetIpAddress());
            vnpay.AddRequestData("vnp_Locale", "vn");
            vnpay.AddRequestData("vnp_OrderInfo", $"Payment for booking {booking.Id}");
            vnpay.AddRequestData("vnp_OrderType", "billpayment");
            vnpay.AddRequestData("vnp_ReturnUrl", returnUrl);
            vnpay.AddRequestData("vnp_TxnRef", payment.Id.ToString());
            vnpay.AddRequestData("vnp_ExpireDate", expiryTime.ToString("yyyyMMddHHmmss"));


            return vnpay.CreateRequestUrl(_vnPayConfig.PaymentUrl, _vnPayConfig.HashSecret);
        }

        private bool ValidateVnPaySignature(PaymentCallbackRequestDTO request)
        {
            if (string.IsNullOrEmpty(request.vnp_SecureHash))
                return false;

            var inputHash = request.vnp_SecureHash;
            var rspData = new Dictionary<string, string>();
            
            foreach (var prop in request.GetType().GetProperties())
            {
                if (prop.Name != "vnp_SecureHash" && prop.GetValue(request) != null)
                {
                    rspData.Add(prop.Name, prop.GetValue(request).ToString());
                }
            }

            var checkSignature = ComputeVnPayHash(rspData);
            
            return inputHash.Equals(checkSignature, StringComparison.OrdinalIgnoreCase);
        }

        private string ComputeVnPayHash(Dictionary<string, string> data)
        {
            var sortedData = new SortedList<string, string>();
            foreach (var item in data)
            {
                if (!string.IsNullOrEmpty(item.Value))
                {
                    sortedData.Add(item.Key, item.Value);
                }
            }

            var stringBuilder = new StringBuilder();
            foreach (var item in sortedData)
            {
                stringBuilder.Append(WebUtility.UrlEncode(item.Key) + "=" + WebUtility.UrlEncode(item.Value) + "&");
            }

            if (stringBuilder.Length > 0)
            {
                stringBuilder.Remove(stringBuilder.Length - 1, 1);
            }

            var signData = stringBuilder.ToString();
            var hash = new StringBuilder();
            
            using var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(_vnPayConfig.HashSecret));
            var keyBytes = hmac.Key;
            var inputBytes = Encoding.UTF8.GetBytes(signData);
            var hashBytes = hmac.ComputeHash(inputBytes);
            
            foreach (var b in hashBytes)
            {
                hash.Append(b.ToString("x2"));
            }

            return hash.ToString();
        }

        private string GetIpAddress()
        {
            string ipAddress;
            try
            {
                ipAddress = _httpContextAccessor.HttpContext.Connection.RemoteIpAddress.ToString();
                
                if (string.IsNullOrEmpty(ipAddress) || ipAddress == "::1")
                    ipAddress = "127.0.0.1";
            }
            catch (Exception)
            {
                ipAddress = "127.0.0.1";
            }

            return ipAddress;
        }
    }

    // Helper class for VNPay integration
    public class VnPayLibrary
    {
        private readonly SortedList<string, string> _requestData = new SortedList<string, string>(new VnPayComparer());
        
        public void AddRequestData(string key, string value)
        {
            if (!string.IsNullOrEmpty(value))
            {
                _requestData.Add(key, value);
            }
        }

        public string CreateRequestUrl(string baseUrl, string secretKey)
        {
            var data = new StringBuilder();
            
            foreach (var kv in _requestData)
            {
                if (!string.IsNullOrEmpty(kv.Value))
                {
                    data.Append(WebUtility.UrlEncode(kv.Key) + "=" + WebUtility.UrlEncode(kv.Value) + "&");
                }
            }
            
            var queryString = data.ToString();
            
            baseUrl += "?" + queryString;
            var signData = queryString;
            if (signData.Length > 0)
            {
                signData = signData.Remove(signData.Length - 1, 1);
            }
            
            var vnpSecureHash = ComputeHmacSha512(secretKey, signData);
            baseUrl += "vnp_SecureHash=" + vnpSecureHash;
            
            return baseUrl;
        }

        private string ComputeHmacSha512(string key, string data)
        {
            var keyBytes = Encoding.UTF8.GetBytes(key);
            var messageBytes = Encoding.UTF8.GetBytes(data);
            
            using var hmac = new HMACSHA512(keyBytes);
            var hashBytes = hmac.ComputeHash(messageBytes);
            
            var sb = new StringBuilder();
            foreach (var b in hashBytes)
            {
                sb.Append(b.ToString("x2"));
            }
            
            return sb.ToString();
        }
    }

    public class VnPayComparer : IComparer<string>
    {
        public int Compare(string x, string y)
        {
            if (x == y) return 0;
            if (x == null) return -1;
            if (y == null) return 1;
            var vnpCompare = CompareInfo.GetCompareInfo("en-US");
            return vnpCompare.Compare(x, y, CompareOptions.Ordinal);
        }
    }
}