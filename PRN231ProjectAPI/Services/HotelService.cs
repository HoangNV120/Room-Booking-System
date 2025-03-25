using AutoMapper;
using Microsoft.EntityFrameworkCore;
using PRN231ProjectAPI.DTOs.Common;
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

        public async Task<PagedResponseDTO<HotelResponseDTO>> GetHotels(HotelSearchDTO searchParams)
        {
            var query = _context.Hotels.AsQueryable();

            // Apply name search if provided
            if (!string.IsNullOrWhiteSpace(searchParams.NameSearch))
            {
                var searchTerm = searchParams.NameSearch.ToLower();
                query = query.Where(h => h.Name.ToLower().Contains(searchTerm));
            }

            // Count total before pagination
            var totalCount = await query.CountAsync();

            // Apply ordering by rating
            if (searchParams.SortDescending)
            {
                query = query.OrderByDescending(h => h.Rating);
            }
            else
            {
                query = query.OrderBy(h => h.Rating);
            }

            // Apply pagination
            var hotels = await query
                .Skip((searchParams.PageNumber - 1) * searchParams.PageSize)
                .Take(searchParams.PageSize)
                .ToListAsync();

            // Map to DTOs
            var hotelDtos = _mapper.Map<List<HotelResponseDTO>>(hotels);

            // Create paged response
            return new PagedResponseDTO<HotelResponseDTO>
            {
                Items = hotelDtos,
                PageNumber = searchParams.PageNumber,
                PageSize = searchParams.PageSize,
                TotalCount = totalCount,
                TotalPages = (int)Math.Ceiling(totalCount / (double)searchParams.PageSize)
            };
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