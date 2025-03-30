using Microsoft.EntityFrameworkCore;
using PRN231ProjectAPI.Models;

namespace PRN231ProjectAPI.Services;

public class BookingExpirationService : BackgroundService
{
    private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(1);
    private readonly ILogger<BookingExpirationService> _logger;
    private readonly IServiceProvider _services;

    public BookingExpirationService(IServiceProvider services, ILogger<BookingExpirationService> logger)
    {
        _services = services;
        _logger = logger;
    }

    protected override async Task ExecuteAsync(CancellationToken stoppingToken)
    {
        _logger.LogInformation("Booking payment expiration service is running");

        while (!stoppingToken.IsCancellationRequested)
        {
            await ProcessExpiredBookingPayments(stoppingToken);
            await Task.Delay(_checkInterval, stoppingToken);
        }
    }

    private async Task ProcessExpiredBookingPayments(CancellationToken stoppingToken)
    {
        using var scope = _services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<HotelBookingDBContext>();

        var now = DateTime.Now;
        var expiredBookings = await context.Bookings
            .Where(b => b.PaymentStatus == "Unpaid" && b.PaymentExpiresAt < now && b.Status == "Pending")
            .ToListAsync(stoppingToken);

        foreach (var booking in expiredBookings)
        {
            booking.PaymentStatus = "Unpaid";
            booking.Status = "Canceled";

            // Optionally, update room status back to Available
            var room = await context.Rooms.FindAsync(booking.RoomId);
            if (room != null) room.Status = "Available";
        }

        if (expiredBookings.Any())
        {
            await context.SaveChangesAsync(stoppingToken);
            _logger.LogInformation($"Processed {expiredBookings.Count} expired booking payments");
        }
    }
}