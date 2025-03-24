using AutoMapper;
using Microsoft.EntityFrameworkCore;
using PRN231ProjectAPI.DTOs.Room;
using PRN231ProjectAPI.Exceptions;
using PRN231ProjectAPI.Models;

namespace PRN231ProjectAPI.Services
{
    public class RoomService
    {
        private readonly HotelBookingDBContext _context;
        private readonly IMapper _mapper;

        public RoomService(HotelBookingDBContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public IQueryable<RoomResponseDTO> GetRooms()
        {
            var rooms = _context.Rooms
                .Include(r => r.Hotel)
                .AsQueryable();

            return _mapper.ProjectTo<RoomResponseDTO>(rooms);
        }

        public async Task<RoomResponseDTO> GetRoomById(Guid id)
        {
            var room = await _context.Rooms
                .Include(r => r.Hotel)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (room == null)
                throw new NotFoundException($"Room with ID {id} not found");

            return _mapper.Map<RoomResponseDTO>(room);
        }

        public async Task<IEnumerable<RoomResponseDTO>> GetAvailableRooms(AvailabilityRequestDTO request)
        {
            if (request.CheckIn >= request.CheckOut)
                throw new BadRequestException("Check-out date must be after check-in date");

            var bookedRoomIds = await _context.Bookings
                .Where(b =>
                    (b.Status != "Cancelled") &&
                    ((request.CheckIn >= b.CheckInDate && request.CheckIn < b.CheckOutDate) ||
                     (request.CheckOut > b.CheckInDate && request.CheckOut <= b.CheckOutDate) ||
                     (request.CheckIn <= b.CheckInDate && request.CheckOut >= b.CheckOutDate)))
                .Select(b => b.RoomId)
                .ToListAsync();

            var query = _context.Rooms
                .Include(r => r.Hotel)
                .Where(r => r.Status == "Available" && !bookedRoomIds.Contains(r.Id));

            // Apply filters if provided
            if (!string.IsNullOrEmpty(request.RoomType))
                query = query.Where(r => r.RoomType == request.RoomType);

            if (request.MaxPrice.HasValue)
                query = query.Where(r => r.Price <= request.MaxPrice.Value);

            var availableRooms = await query.ToListAsync();
            return _mapper.Map<List<RoomResponseDTO>>(availableRooms);
        }

        public async Task<RoomResponseDTO> CreateRoom(RoomCreateDTO request)
        {
            var hotel = await _context.Hotels.FindAsync(request.HotelId);
            if (hotel == null)
                throw new NotFoundException($"Hotel with ID {request.HotelId} not found");

            var room = _mapper.Map<Room>(request);
            room.Id = Guid.NewGuid();
            room.CreatedAt = DateTime.UtcNow;

            _context.Rooms.Add(room);
            await _context.SaveChangesAsync();

            var createdRoom = await _context.Rooms
                .Include(r => r.Hotel)
                .FirstOrDefaultAsync(r => r.Id == room.Id);

            return _mapper.Map<RoomResponseDTO>(createdRoom);
        }

        public async Task<RoomResponseDTO> UpdateRoom(Guid id, RoomUpdateDTO request)
        {
            var room = await _context.Rooms.FindAsync(id);
            if (room == null)
                throw new NotFoundException($"Room with ID {id} not found");

            if (request.HotelId.HasValue)
            {
                var hotel = await _context.Hotels.FindAsync(request.HotelId.Value);
                if (hotel == null)
                    throw new NotFoundException($"Hotel with ID {request.HotelId} not found");

                room.HotelId = request.HotelId.Value;
            }

            if (request.RoomType != null)
                room.RoomType = request.RoomType;

            if (request.Price.HasValue)
                room.Price = request.Price.Value;

            if (request.Status != null)
                room.Status = request.Status;

            await _context.SaveChangesAsync();

            var updatedRoom = await _context.Rooms
                .Include(r => r.Hotel)
                .FirstOrDefaultAsync(r => r.Id == id);

            return _mapper.Map<RoomResponseDTO>(updatedRoom);
        }

        public async Task DeleteRoom(Guid id)
        {
            var room = await _context.Rooms.FindAsync(id);
            if (room == null)
                throw new NotFoundException($"Room with ID {id} not found");

            // Check if room has active bookings
            var hasActiveBookings = await _context.Bookings
                .AnyAsync(b => b.RoomId == id && b.Status != "Cancelled" && b.CheckOutDate > DateTime.UtcNow);

            if (hasActiveBookings)
                throw new ConflictException("Cannot delete room with active bookings");

            _context.Rooms.Remove(room);
            await _context.SaveChangesAsync();
        }
    }
}