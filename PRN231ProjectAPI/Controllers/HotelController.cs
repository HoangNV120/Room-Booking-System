using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PRN231ProjectAPI.DTOs.Common;
using PRN231ProjectAPI.DTOs.Hotel;
using PRN231ProjectAPI.Exceptions;
using PRN231ProjectAPI.Services;

namespace PRN231ProjectAPI.Controllers
{
    [Route("api/hotels")]
    [ApiController]
    public class HotelController : ControllerBase
    {
        private readonly HotelService _hotelService;

        public HotelController(HotelService hotelService)
        {
            _hotelService = hotelService;
        }

        [HttpGet]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<HotelResponseDTO>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetHotels()
        {
            try
            {
                var hotelDtos = await _hotelService.GetHotels();
                return Ok(new ApiResponse<IEnumerable<HotelResponseDTO>>(hotelDtos));
            }
            catch (Exception ex)
            {
                throw new InternalServerException($"Error retrieving hotels: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        [ProducesResponseType(typeof(ApiResponse<HotelResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetHotel(Guid id)
        {
            try
            {
                var hotelDto = await _hotelService.GetHotelById(id);
                return Ok(new ApiResponse<HotelResponseDTO>(hotelDto));
            }
            catch (NotFoundException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw new InternalServerException($"Error retrieving hotel: {ex.Message}");
            }
        }

        [HttpPost]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<HotelResponseDTO>), StatusCodes.Status201Created)]
        public async Task<IActionResult> CreateHotel([FromBody] HotelCreateDTO request)
        {
            try
            {
                var hotelDto = await _hotelService.CreateHotel(request);
                return StatusCode(201, new ApiResponse<HotelResponseDTO>(201, "Hotel created successfully", hotelDto));
            }
            catch (Exception ex)
            {
                throw new InternalServerException($"Error creating hotel: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<HotelResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> UpdateHotel(Guid id, [FromBody] HotelUpdateDTO request)
        {
            try
            {
                var hotelDto = await _hotelService.UpdateHotel(id, request);
                return Ok(new ApiResponse<HotelResponseDTO>(hotelDto));
            }
            catch (NotFoundException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw new InternalServerException($"Error updating hotel: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> DeleteHotel(Guid id)
        {
            try
            {
                await _hotelService.DeleteHotel(id);
                return Ok(new ApiResponse<object>(200, "Hotel deleted successfully"));
            }
            catch (NotFoundException)
            {
                throw;
            }
            catch (ConflictException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw new InternalServerException($"Error deleting hotel: {ex.Message}");
            }
        }
    }
}