using AutoMapper;
using Microsoft.EntityFrameworkCore;
using PRN231ProjectAPI.DTOs.Booking;
using PRN231ProjectAPI.Exceptions;
using PRN231ProjectAPI.Models;

namespace PRN231ProjectAPI.Services
{
    public class BookingService
    {
        private readonly HotelBookingDBContext _context;
        private readonly IMapper _mapper;

        public BookingService(HotelBookingDBContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
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

                if (filter.StartDate.HasValue)
                    query = query.Where(b => b.CheckInDate >= filter.StartDate.Value);

                if (filter.EndDate.HasValue)
                    query = query.Where(b => b.CheckOutDate <= filter.EndDate.Value);

                if (!string.IsNullOrEmpty(filter.Status))
                    query = query.Where(b => b.Status == filter.Status);

                if (!string.IsNullOrEmpty(filter.PaymentStatus))
                    query = query.Where(b => b.PaymentStatus == filter.PaymentStatus);
            }

            var bookings = await query.ToListAsync();
            return _mapper.Map<List<BookingResponseDTO>>(bookings);
        }

        public async Task<BookingResponseDTO> GetBookingById(Guid id)
        {
            var booking = await _context.Bookings
                .Include(b => b.Room)
                .Include(b => b.Room.Hotel)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (booking == null)
                throw new NotFoundException($"Booking with ID {id} not found");

            return _mapper.Map<BookingResponseDTO>(booking);
        }

        public async Task<IEnumerable<BookingResponseDTO>> GetUserBookings(Guid userId)
        {
            var user = await _context.Users.FindAsync(userId);
            if (user == null)
                throw new NotFoundException($"User with ID {userId} not found");

            var bookings = await _context.Bookings
                .Include(b => b.Room)
                .Include(b => b.Room.Hotel)
                .Where(b => b.UserId == userId)
                .ToListAsync();

            return _mapper.Map<List<BookingResponseDTO>>(bookings);
        }

        public async Task<BookingResponseDTO> CreateBooking(BookingCreateDTO request)
        {
            // Validate user
            var user = await _context.Users.FindAsync(request.UserId);
            if (user == null)
                throw new NotFoundException($"User with ID {request.UserId} not found");

            // Validate room
            var room = await _context.Rooms
                .Include(r => r.Hotel)
                .FirstOrDefaultAsync(r => r.Id == request.RoomId);
                
            if (room == null)
                throw new NotFoundException($"Room with ID {request.RoomId} not found");

            if (room.Status != "Available")
                throw new ConflictException("Room is not available for booking");

            // Validate dates
            if (request.CheckInDate >= request.CheckOutDate)
                throw new BadRequestException("Check-out date must be after check-in date");

            if (request.CheckInDate.Date < DateTime.UtcNow.Date)
                throw new BadRequestException("Check-in date cannot be in the past");

            // Check if room is already booked for the requested dates
            var isRoomBooked = await _context.Bookings
                .AnyAsync(b => 
                    b.RoomId == request.RoomId && 
                    b.Status != "Cancelled" &&
                    ((request.CheckInDate >= b.CheckInDate && request.CheckInDate < b.CheckOutDate) ||
                     (request.CheckOutDate > b.CheckInDate && request.CheckOutDate <= b.CheckOutDate) ||
                     (request.CheckInDate <= b.CheckInDate && request.CheckOutDate >= b.CheckOutDate)));

            if (isRoomBooked)
                throw new ConflictException("Room is already booked for the selected dates");

            // Calculate total price (number of nights * price per night)
            var numberOfNights = (int)(request.CheckOutDate - request.CheckInDate).TotalDays;
            var totalPrice = room.Price * numberOfNights;

            // Create booking
            var booking = new Booking
            {
                Id = Guid.NewGuid(),
                UserId = request.UserId,
                RoomId = request.RoomId,
                CheckInDate = request.CheckInDate,
                CheckOutDate = request.CheckOutDate,
                TotalPrice = totalPrice,
                Status = "Pending", // Initial status
                PaymentStatus = "Unpaid", // Initial payment status
                CreatedAt = DateTime.UtcNow
            };

            _context.Bookings.Add(booking);
            await _context.SaveChangesAsync();

            // Get the created booking with related entities
            var createdBooking = await _context.Bookings
                .Include(b => b.Room)
                .Include(b => b.Room.Hotel)
                .FirstOrDefaultAsync(b => b.Id == booking.Id);

            return _mapper.Map<BookingResponseDTO>(createdBooking);
        }

        public async Task<BookingResponseDTO> UpdateBooking(Guid id, BookingUpdateDTO request)
        {
            var booking = await _context.Bookings
                .Include(b => b.Room)
                .FirstOrDefaultAsync(b => b.Id == id);

            if (booking == null)
                throw new NotFoundException($"Booking with ID {id} not found");

            // Cannot update cancelled bookings
            if (booking.Status == "Cancelled")
                throw new ConflictException("Cannot update a cancelled booking");

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
                        b.Status != "Cancelled" &&
                        ((request.CheckInDate >= b.CheckInDate && request.CheckInDate < b.CheckOutDate) ||
                         (request.CheckOutDate > b.CheckInDate && request.CheckOutDate <= b.CheckOutDate) ||
                         (request.CheckInDate <= b.CheckInDate && request.CheckOutDate >= b.CheckOutDate)));

                if (isDateConflict)
                    throw new ConflictException("Room is already booked for the selected dates");

                booking.CheckInDate = request.CheckInDate.Value;
                booking.CheckOutDate = request.CheckOutDate.Value;

                // Recalculate total price
                int numberOfNights = (int)(booking.CheckOutDate - booking.CheckInDate).TotalDays;
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
                if (!new[] { "Confirmed", "CheckedIn", "CheckedOut", "Cancelled" }.Contains(request.Status))
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

        public async Task CancelBooking(Guid id)
        {
            var booking = await _context.Bookings.FindAsync(id);
            if (booking == null)
                throw new NotFoundException($"Booking with ID {id} not found");

            // Cannot cancel a booking that's already checked in or checked out
            if (booking.Status == "CheckedIn" || booking.Status == "CheckedOut")
                throw new ConflictException($"Cannot cancel a booking with status '{booking.Status}'");

            // Update booking status
            booking.Status = "Cancelled";
            
            // If payment was made, set for refund
            if (booking.PaymentStatus == "Paid")
                booking.PaymentStatus = "Refunded";

            await _context.SaveChangesAsync();
        }
    }
}