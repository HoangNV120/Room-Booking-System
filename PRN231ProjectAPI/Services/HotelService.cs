using AutoMapper;
using Microsoft.EntityFrameworkCore;
using PRN231ProjectAPI.DTOs.Hotel;
using PRN231ProjectAPI.Exceptions;
using PRN231ProjectAPI.Models;

namespace PRN231ProjectAPI.Services
{
    public class HotelService
    {
        private readonly HotelBookingDBContext _context;
        private readonly IMapper _mapper;

        public HotelService(HotelBookingDBContext context, IMapper mapper)
        {
            _context = context;
            _mapper = mapper;
        }

        public async Task<IEnumerable<HotelResponseDTO>> GetHotels()
        {
            var hotels = await _context.Hotels.ToListAsync();
            return _mapper.Map<List<HotelResponseDTO>>(hotels);
        }

        public async Task<HotelResponseDTO> GetHotelById(Guid id)
        {
            var hotel = await _context.Hotels.FindAsync(id);
            
            if (hotel == null)
                throw new NotFoundException($"Hotel with ID {id} not found");

            return _mapper.Map<HotelResponseDTO>(hotel);
        }

        public async Task<HotelResponseDTO> CreateHotel(HotelCreateDTO request)
        {
            var hotel = _mapper.Map<Hotel>(request);
            
            _context.Hotels.Add(hotel);
            await _context.SaveChangesAsync();

            return _mapper.Map<HotelResponseDTO>(hotel);
        }

        public async Task<HotelResponseDTO> UpdateHotel(Guid id, HotelUpdateDTO request)
        {
            var hotel = await _context.Hotels.FindAsync(id);
            if (hotel == null)
                throw new NotFoundException($"Hotel with ID {id} not found");

            _mapper.Map(request, hotel);
            await _context.SaveChangesAsync();

            return _mapper.Map<HotelResponseDTO>(hotel);
        }

        public async Task DeleteHotel(Guid id)
        {
            var hotel = await _context.Hotels.FindAsync(id);
            if (hotel == null)
                throw new NotFoundException($"Hotel with ID {id} not found");

            // Check if hotel has rooms
            var hasRooms = await _context.Rooms.AnyAsync(r => r.HotelId == id);
            if (hasRooms)
                throw new ConflictException("Cannot delete hotel with existing rooms");

            _context.Hotels.Remove(hotel);
            await _context.SaveChangesAsync();
        }
    }
}