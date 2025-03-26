using Microsoft.EntityFrameworkCore;
using PRN231ProjectAPI.Models;

namespace PRN231ProjectAPI.Services
{
    public class PaymentExpirationService : BackgroundService
    {
        private readonly IServiceProvider _services;
        private readonly ILogger<PaymentExpirationService> _logger;
        private readonly TimeSpan _checkInterval = TimeSpan.FromMinutes(1);

        public PaymentExpirationService(IServiceProvider services, ILogger<PaymentExpirationService> logger)
        {
            _services = services;
            _logger = logger;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            _logger.LogInformation("Payment expiration service is running");

            while (!stoppingToken.IsCancellationRequested)
            {
                await ProcessExpiredPayments(stoppingToken);
                await Task.Delay(_checkInterval, stoppingToken);
            }
        }

        private async Task ProcessExpiredPayments(CancellationToken stoppingToken)
        {
            using var scope = _services.CreateScope();
            var context = scope.ServiceProvider.GetRequiredService<HotelBookingDBContext>();

            var now = DateTime.UtcNow;
            var expiredPayments = await context.Payments
                .Include(p => p.Booking)
                .Where(p => p.Status == "Pending" && p.ExpiresAt < now)
                .ToListAsync(stoppingToken);

            foreach (var payment in expiredPayments)
            {
                payment.Status = "Failed";

                // Also cancel the associated booking
                if (payment.Booking != null)
                {
                    payment.Booking.Status = "Canceled"; // Make sure to use the correct value from your constraint
                    payment.Booking.PaymentStatus = "Unpaid";

                    // Optionally, update room status back to Available
                    var room = await context.Rooms.FindAsync(payment.Booking.RoomId);
                    if (room != null)
                    {
                        room.Status = "Available";
                    }
                }
            }

            if (expiredPayments.Any())
            {
                await context.SaveChangesAsync(stoppingToken);
                _logger.LogInformation(
                    $"Processed {expiredPayments.Count} expired payments and canceled their bookings");
            }
        }
    }
}