using AutoMapper;
using Microsoft.EntityFrameworkCore;
using PRN231ProjectAPI.DTOs.Common;
using PRN231ProjectAPI.DTOs.Room;
using PRN231ProjectAPI.Exceptions;
using PRN231ProjectAPI.Models;

namespace PRN231ProjectAPI.Services;

public class RoomService
{
    private readonly HotelBookingDBContext _context;
    private readonly ImageService _imageService;
    private readonly IMapper _mapper;

    public RoomService(HotelBookingDBContext context, IMapper mapper, ImageService imageService)
    {
        _context = context;
        _mapper = mapper;
        _imageService = imageService;
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
                b.Status != "Cancelled" &&
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
        // Validate hotel exists
        var hotel = await _context.Hotels.FindAsync(request.HotelId);
        if (hotel == null)
            throw new NotFoundException($"Hotel with ID {request.HotelId} not found");

        // Create room entity with ID first
        var room = _mapper.Map<Room>(request);
        room.Id = Guid.NewGuid();
        room.CreatedAt = DateTime.Now;

        // Upload image if provided
        var imageUrl = string.Empty;
        if (request.Image != null && request.Image.Length > 0)
        {
            // Use room_roomId naming convention
            var imageName = $"room_{room.Id}";
            imageUrl = await _imageService.UploadImageAsync(request.Image, null, imageName);
        }

        room.ImageUrl = imageUrl;

        _context.Rooms.Add(room);
        await _context.SaveChangesAsync();

        return _mapper.Map<RoomResponseDTO>(room);
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
        }

        _mapper.Map(request, room);

        // Upload image if provided
        if (request.Image != null && request.Image.Length > 0)
        {
            var imageName = $"room_{id}";
            room.ImageUrl = await _imageService.UploadImageAsync(request.Image, room.ImageUrl, imageName);
        }

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

    public async Task<PagedResponseDTO<RoomResponseDTO>> GetRoomsByHotelId(Guid hotelId,
        RoomFilterRequestDTO request)
    {
        // Check if hotel exists
        var hotelExists = await _context.Hotels.AnyAsync(h => h.Id == hotelId);
        if (!hotelExists)
            throw new NotFoundException($"Hotel with ID {hotelId} not found");

        // Start with rooms from the specified hotel
        var query = _context.Rooms
            .Include(r => r.Hotel)
            .Where(r => r.HotelId == hotelId)
            .AsQueryable();

        // Apply room type filter if provided
        if (!string.IsNullOrWhiteSpace(request.RoomType)) query = query.Where(r => r.RoomType == request.RoomType);

        // Count total before pagination
        var totalCount = await query.CountAsync();

        // Apply ordering by price
        if (request.SortDescending)
            query = query.OrderByDescending(r => r.Price);
        else
            query = query.OrderBy(r => r.Price);

        // Apply pagination
        var rooms = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync();

        // Map to DTOs
        var roomDtos = _mapper.Map<List<RoomResponseDTO>>(rooms);

        // Create paged response
        return new PagedResponseDTO<RoomResponseDTO>
        {
            Items = roomDtos,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize)
        };
    }
}