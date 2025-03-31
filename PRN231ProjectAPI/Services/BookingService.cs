using System.Net;
using System.Security.Cryptography;
using System.Text;
using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Options;
using PRN231ProjectAPI.Config;
using PRN231ProjectAPI.DTOs.Booking;
using PRN231ProjectAPI.DTOs.Common;
using PRN231ProjectAPI.DTOs.Payment;
using PRN231ProjectAPI.Exceptions;
using PRN231ProjectAPI.Models;
using PRN231ProjectAPI.Utils;

namespace PRN231ProjectAPI.Services;

public class BookingService
{
    private readonly HotelBookingDBContext _context;
    private readonly IHttpContextAccessor _httpContextAccessor;
    private readonly IMapper _mapper;
    private readonly IOptions<VnPayConfig> _vnPayConfig;

    public BookingService(
        HotelBookingDBContext context,
        IMapper mapper,
        IOptions<VnPayConfig> vnPayConfig,
        IHttpContextAccessor httpContextAccessor)
    {
        _context = context;
        _mapper = mapper;
        _vnPayConfig = vnPayConfig;
        _httpContextAccessor = httpContextAccessor;
    }

    public async Task<IEnumerable<BookingResponseDTO>> GetBookings(BookingFilterDTO filter = null)
    {
        var query = _context.Bookings
            .Include(b => b.Room)
            .Include(b => b.Room.Hotel)
            .AsQueryable();

        // Apply filters if provided
        if (filter != null)
        {
            if (filter.UserId.HasValue)
                query = query.Where(b => b.UserId == filter.UserId.Value);

            // Apply ordering by CheckInDate if specified
            if (filter.StartDateOrder.HasValue)
                query = filter.StartDateOrder.Value
                    ? query.OrderBy(b => b.CheckInDate)
                    : query.OrderByDescending(b => b.CheckInDate);

            // Apply ordering by CheckOutDate if specified
            if (filter.EndDateOrder.HasValue && !filter.StartDateOrder.HasValue)
                query = filter.EndDateOrder.Value
                    ? query.OrderBy(b => b.CheckOutDate)
                    : query.OrderByDescending(b => b.CheckOutDate);

            if (!string.IsNullOrEmpty(filter.Status))
                query = query.Where(b => b.Status == filter.Status);

            if (!string.IsNullOrEmpty(filter.PaymentStatus))
                query = query.Where(b => b.PaymentStatus == filter.PaymentStatus);
        }

        var bookings = await query.ToListAsync();
        return _mapper.Map<List<BookingResponseDTO>>(bookings);
    }

    public async Task<BookingResponseDTO> GetBookingById(Guid id, string userId)
    {
        var booking = await _context.Bookings
            .Include(b => b.Room)
            .Include(b => b.Room.Hotel)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking == null)
            throw new NotFoundException($"Booking with ID {id} not found");
        
        if (booking.UserId != Guid.Parse(userId))
            throw new ForbiddenException("You are not authorized to view this booking");
        

        return _mapper.Map<BookingResponseDTO>(booking);
    }

    public async Task<PagedResponseDTO<BookingResponseDTO>> GetUserBookings(BookingFilterDTO filter)
    {
        var query = _context.Bookings
            .Include(b => b.Room)
            .Include(b => b.Room.Hotel)
            .Include(b => b.User)
            .AsQueryable();

        // Apply filters if provided
        if (filter != null)
        {
            if (filter.UserId.HasValue)
                query = query.Where(b => b.UserId == filter.UserId.Value);

            if (!string.IsNullOrEmpty(filter.Status))
                query = query.Where(b => b.Status == filter.Status);

            if (!string.IsNullOrEmpty(filter.PaymentStatus))
                query = query.Where(b => b.PaymentStatus == filter.PaymentStatus);

            // Apply ordering by CheckInDate if specified
            if (filter.StartDateOrder.HasValue)
                query = filter.StartDateOrder.Value
                    ? query.OrderBy(b => b.CheckInDate)
                    : query.OrderByDescending(b => b.CheckInDate);

            // Apply ordering by CheckOutDate if specified
            if (filter.EndDateOrder.HasValue && !filter.StartDateOrder.HasValue)
                query = filter.EndDateOrder.Value
                    ? query.OrderBy(b => b.CheckOutDate)
                    : query.OrderByDescending(b => b.CheckOutDate);
        }

        // Count total before pagination
        var totalCount = await query.CountAsync();

        // Apply pagination
        query = query
            .Skip((filter.PageNumber - 1) * filter.PageSize)
            .Take(filter.PageSize);

        // Execute query and map results
        var bookings = await query.ToListAsync();
        var mappedBookings = _mapper.Map<List<BookingResponseDTO>>(bookings);

        // Create paged response
        return new PagedResponseDTO<BookingResponseDTO>
        {
            Items = mappedBookings,
            PageNumber = filter.PageNumber,
            PageSize = filter.PageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)filter.PageSize)
        };
    }

    public async Task<BookingResponseDTO> CreateBooking(BookingCreateDTO request)
    {
        // Validation logic (keep existing code)
        var user = await _context.Users.FindAsync(request.UserId);
        if (user == null)
            throw new NotFoundException($"User with ID {request.UserId} not found");

        var room = await _context.Rooms
            .Include(r => r.Hotel)
            .FirstOrDefaultAsync(r => r.Id == request.RoomId);

        if (room == null)
            throw new NotFoundException($"Room with ID {request.RoomId} not found");

        if (request.CheckInDate >= request.CheckOutDate)
            throw new BadRequestException("Check-out date must be after check-in date");

        if (request.CheckInDate.Date < DateTime.UtcNow.Date)
            throw new BadRequestException("Check-in date cannot be in the past");

        var isRoomBooked = await _context.Bookings
            .AnyAsync(b =>
                b.RoomId == request.RoomId &&
                b.Status != "Canceled" &&
                ((request.CheckInDate >= b.CheckInDate && request.CheckInDate < b.CheckOutDate) ||
                 (request.CheckOutDate > b.CheckInDate && request.CheckOutDate <= b.CheckOutDate) ||
                 (request.CheckInDate <= b.CheckInDate && request.CheckOutDate >= b.CheckOutDate)));

        if (isRoomBooked)
            throw new ConflictException("Room is already booked for the selected dates");

        var numberOfNights = (int)(request.CheckOutDate - request.CheckInDate).TotalDays;
        var totalPrice = room.Price * numberOfNights;

        // Create booking with payment fields
        var booking = new Booking
        {
            Id = Guid.NewGuid(),
            UserId = request.UserId ?? Guid.Empty,
            RoomId = request.RoomId,
            CheckInDate = request.CheckInDate,
            CheckOutDate = request.CheckOutDate,
            TotalPrice = totalPrice,
            Status = "Pending",
            PaymentStatus = "Unpaid",
            CreatedAt = DateTime.UtcNow,
            PaymentMethod = "vnpay", // Default payment method
            PaymentExpiresAt = DateTime.Now.AddMinutes(15)
        };

        _context.Bookings.Add(booking);
        await _context.SaveChangesAsync();

        var createdBooking = await _context.Bookings
            .Include(b => b.Room)
            .Include(b => b.Room.Hotel)
            .Include(b => b.User)
            .FirstOrDefaultAsync(b => b.Id == booking.Id);

        // Return without generating payment URL
        return _mapper.Map<BookingResponseDTO>(createdBooking);
    }

    public async Task<PaymentUrlResponseDTO> GeneratePaymentUrl(Guid bookingId)
    {
        const string returnUrl = "http://localhost:3000/check-booking";
        var booking = await _context.Bookings.FindAsync(bookingId);
        if (booking == null)
            throw new NotFoundException($"Booking with ID {bookingId} not found");

        if (booking.Status != "Pending" || booking.PaymentStatus != "Unpaid")
            throw new ConflictException("Payment can only be initiated for pending/unpaid bookings");

        // Set payment expiration time
        await _context.SaveChangesAsync();

        var paymentUrl = CreateVnPayUrl(booking, returnUrl);

        return new PaymentUrlResponseDTO
        {
            PaymentUrl = paymentUrl,
            ExpiresAt = booking.PaymentExpiresAt.Value
        };
    }

    private string CreateVnPayUrl(Booking booking, string? returnUrl)
    {
        var vnpReturnUrl = !string.IsNullOrEmpty(returnUrl)
            ? returnUrl
            : _vnPayConfig.Value.ReturnUrl;

        var vnpay = new VnPayLibrary();
        vnpay.AddRequestData("vnp_Version", _vnPayConfig.Value.Version);
        vnpay.AddRequestData("vnp_Command", "pay");
        vnpay.AddRequestData("vnp_TmnCode", _vnPayConfig.Value.TmnCode);
        vnpay.AddRequestData("vnp_Amount", ((long)(booking.TotalPrice * 100)).ToString());
        vnpay.AddRequestData("vnp_CreateDate", DateTime.Now.ToString("yyyyMMddHHmmss"));
        vnpay.AddRequestData("vnp_CurrCode", "VND");
        vnpay.AddRequestData("vnp_IpAddr", GetIpAddress());
        vnpay.AddRequestData("vnp_Locale", "vn");
        vnpay.AddRequestData("vnp_OrderInfo", $"Payment for booking {booking.Id}");
        vnpay.AddRequestData("vnp_OrderType", "billpayment");
        vnpay.AddRequestData("vnp_ReturnUrl", vnpReturnUrl);
        vnpay.AddRequestData("vnp_TxnRef", booking.Id.ToString());
        vnpay.AddRequestData("vnp_ExpireDate", booking.PaymentExpiresAt?.ToString("yyyyMMddHHmmss"));

        return vnpay.CreateRequestUrl(_vnPayConfig.Value.PaymentUrl, _vnPayConfig.Value.HashSecret);
    }

    public async Task<BookingResponseDTO> ProcessVnPayCallback(PaymentCallbackRequestDTO request)
    {
        try
        {
            // Validate VnPay signature
            var isValidSignature = ValidateVnPaySignature(request);
            if (!isValidSignature)
                throw new BadRequestException("Invalid payment signature");

            // Find booking by transaction reference
            var bookingId = Guid.Parse(request.vnp_TxnRef);
            var booking = await _context.Bookings
                .Include(b => b.Room)
                .Include(b => b.Room.Hotel)
                .Include(b => b.User)
                .FirstOrDefaultAsync(b => b.Id == bookingId);

            if (booking == null)
                throw new NotFoundException($"Booking with ID {bookingId} not found");

            // Update booking based on VnPay response
            if (request.vnp_ResponseCode == "00" && request.vnp_TransactionStatus == "00")
            {
                booking.PaymentStatus = "Paid";
                booking.Status = "Confirmed";
                // Ensure transaction number is handled correctly
                booking.PaymentTransactionId = request.vnp_TransactionNo ?? "0";
                booking.PaymentBankCode = request.vnp_BankCode;
                // Bank tran no might be null in the callback
                booking.PaymentBankTranNo = request.vnp_BankTranNo ?? string.Empty;
                booking.PaymentCardType = request.vnp_CardType;
            }
            else
            {
                booking.PaymentStatus = "Unpaid";
                booking.Status = "Canceled"; 
            }

            // Save changes with detailed error handling
            try
            {
                await _context.SaveChangesAsync();
            }
            catch (DbUpdateException dbEx)
            {
                var innerMessage = dbEx.InnerException?.Message ?? "No inner exception details";
                throw new InvalidOperationException($"Database update failed: {innerMessage}", dbEx);
            }

            return _mapper.Map<BookingResponseDTO>(booking);
        }
        catch (FormatException ex)
        {
            throw new BadRequestException($"Invalid format in payment data: {ex.Message}");
        }
        catch (Exception ex) when (!(ex is BadRequestException || ex is NotFoundException ||
                                     ex is InvalidOperationException))
        {
            throw new InvalidOperationException($"Payment processing failed: {ex.Message}", ex);
        }
    }

    // Helper methods for payment processing
    private bool ValidateVnPaySignature(PaymentCallbackRequestDTO request)
    {
        if (string.IsNullOrEmpty(request.vnp_SecureHash))
            return false;

        var inputHash = request.vnp_SecureHash;
        var rspData = new Dictionary<string, string>();

        foreach (var prop in request.GetType().GetProperties())
            if (prop.Name != "vnp_SecureHash" && prop.GetValue(request) != null)
                rspData.Add(prop.Name, prop.GetValue(request).ToString());

        var checkSignature = ComputeVnPayHash(rspData);
        return inputHash.Equals(checkSignature, StringComparison.OrdinalIgnoreCase);
    }

    private string ComputeVnPayHash(Dictionary<string, string> data)
    {
        var sortedData = new SortedList<string, string>();
        foreach (var item in data)
            if (!string.IsNullOrEmpty(item.Value))
                sortedData.Add(item.Key, item.Value);

        var stringBuilder = new StringBuilder();
        foreach (var item in sortedData)
            stringBuilder.Append(WebUtility.UrlEncode(item.Key) + "=" + WebUtility.UrlEncode(item.Value) + "&");

        if (stringBuilder.Length > 0) stringBuilder.Remove(stringBuilder.Length - 1, 1);

        var signData = stringBuilder.ToString();
        var hash = new StringBuilder();

        using var hmac = new HMACSHA512(Encoding.UTF8.GetBytes(_vnPayConfig.Value.HashSecret));
        var keyBytes = hmac.Key;
        var inputBytes = Encoding.UTF8.GetBytes(signData);
        var hashBytes = hmac.ComputeHash(inputBytes);

        foreach (var b in hashBytes) hash.Append(b.ToString("x2"));

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

    public async Task<BookingResponseDTO> UpdateBooking(Guid id, BookingUpdateDTO request)
    {
        var booking = await _context.Bookings
            .Include(b => b.Room)
            .FirstOrDefaultAsync(b => b.Id == id);

        if (booking == null)
            throw new NotFoundException($"Booking with ID {id} not found");

        // Cannot update cancelled bookings
        if (booking.Status == "Canceled")
            throw new ConflictException("Cannot update a canceled booking");

        // Update check-in and check-out dates if provided
        if (request.CheckInDate.HasValue && request.CheckOutDate.HasValue)
        {
            if (request.CheckInDate >= request.CheckOutDate)
                throw new BadRequestException("Check-out date must be after check-in date");

            if (request.CheckInDate.Value.Date < DateTime.UtcNow.Date)
                throw new BadRequestException("Check-in date cannot be in the past");

            // Check if the new dates conflict with other bookings
            var isDateConflict = await _context.Bookings
                .AnyAsync(b =>
                    b.Id != id &&
                    b.RoomId == booking.RoomId &&
                    b.Status != "Canceled" &&
                    ((request.CheckInDate >= b.CheckInDate && request.CheckInDate < b.CheckOutDate) ||
                     (request.CheckOutDate > b.CheckInDate && request.CheckOutDate <= b.CheckOutDate) ||
                     (request.CheckInDate <= b.CheckInDate && request.CheckOutDate >= b.CheckOutDate)));

            if (isDateConflict)
                throw new ConflictException("Room is already booked for the selected dates");

            booking.CheckInDate = request.CheckInDate.Value;
            booking.CheckOutDate = request.CheckOutDate.Value;

            // Recalculate total price
            var numberOfNights = (int)(booking.CheckOutDate - booking.CheckInDate).TotalDays;
            booking.TotalPrice = booking.Room.Price * numberOfNights;
        }
        else if (request.CheckInDate.HasValue || request.CheckOutDate.HasValue)
        {
            throw new BadRequestException("Both check-in and check-out dates must be provided together");
        }

        // Update status if provided
        if (!string.IsNullOrEmpty(request.Status))
        {
            // Validate status value
            if (!new[] { "Confirmed", "Canceled" }.Contains(request.Status))
                throw new BadRequestException("Invalid booking status");

            booking.Status = request.Status;
        }

        // Update payment status if provided
        if (!string.IsNullOrEmpty(request.PaymentStatus))
        {
            // Validate payment status value
            if (!new[] { "Pending", "Paid", "Refunded" }.Contains(request.PaymentStatus))
                throw new BadRequestException("Invalid payment status");

            booking.PaymentStatus = request.PaymentStatus;
        }

        await _context.SaveChangesAsync();

        // Get the updated booking with related entities
        var updatedBooking = await _context.Bookings
            .Include(b => b.Room)
            .Include(b => b.Room.Hotel)
            .FirstOrDefaultAsync(b => b.Id == id);

        return _mapper.Map<BookingResponseDTO>(updatedBooking);
    }

    public async Task CancelBooking(Guid id, string userId)
    {
        var booking = await _context.Bookings.FindAsync(id);
        if (booking == null)
            throw new NotFoundException($"Booking with ID {id} not found");

        if (booking.UserId != Guid.Parse(userId))
            throw new ForbiddenException("You are not authorized to cancel this booking");

        // Update booking status
        booking.Status = "Canceled";

        await _context.SaveChangesAsync();
    }
}