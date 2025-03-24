using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PRN231ProjectAPI.DTOs.Booking;
using PRN231ProjectAPI.DTOs.Common;
using PRN231ProjectAPI.Exceptions;
using PRN231ProjectAPI.Services;

namespace PRN231ProjectAPI.Controllers
{
    [Route("api/bookings")]
    [ApiController]
    public class BookingController : ControllerBase
    {
        private readonly BookingService _bookingService;

        public BookingController(BookingService bookingService)
        {
            _bookingService = bookingService;
        }

        [HttpGet]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<BookingResponseDTO>>), StatusCodes.Status200OK)]
        public async Task<IActionResult> GetBookings([FromQuery] BookingFilterDTO filter)
        {
            try
            {
                var bookings = await _bookingService.GetBookings(filter);
                return Ok(new ApiResponse<IEnumerable<BookingResponseDTO>>(bookings));
            }
            catch (Exception ex)
            {
                throw new InternalServerException($"Error retrieving bookings: {ex.Message}");
            }
        }

        [HttpGet("{id}")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<BookingResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetBooking(Guid id)
        {
            try
            {
                var booking = await _bookingService.GetBookingById(id);
                return Ok(new ApiResponse<BookingResponseDTO>(booking));
            }
            catch (NotFoundException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw new InternalServerException($"Error retrieving booking: {ex.Message}");
            }
        }

        [HttpGet("user/{userId}")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<IEnumerable<BookingResponseDTO>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetUserBookings(Guid userId)
        {
            try
            {
                var bookings = await _bookingService.GetUserBookings(userId);
                return Ok(new ApiResponse<IEnumerable<BookingResponseDTO>>(bookings));
            }
            catch (NotFoundException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw new InternalServerException($"Error retrieving user bookings: {ex.Message}");
            }
        }

        [HttpPost]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<BookingResponseDTO>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> CreateBooking([FromBody] BookingCreateDTO request)
        {
            try
            {
                var booking = await _bookingService.CreateBooking(request);
                return StatusCode(201, new ApiResponse<BookingResponseDTO>(201, "Booking created successfully", booking));
            }
            catch (NotFoundException)
            {
                throw;
            }
            catch (BadRequestException)
            {
                throw;
            }
            catch (ConflictException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw new InternalServerException($"Error creating booking: {ex.Message}");
            }
        }

        [HttpPut("{id}")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<BookingResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> UpdateBooking(Guid id, [FromBody] BookingUpdateDTO request)
        {
            try
            {
                var booking = await _bookingService.UpdateBooking(id, request);
                return Ok(new ApiResponse<BookingResponseDTO>(booking));
            }
            catch (NotFoundException)
            {
                throw;
            }
            catch (BadRequestException)
            {
                throw;
            }
            catch (ConflictException)
            {
                throw;
            }
            catch (Exception ex)
            {
                throw new InternalServerException($"Error updating booking: {ex.Message}");
            }
        }

        [HttpDelete("{id}")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> CancelBooking(Guid id)
        {
            try
            {
                await _bookingService.CancelBooking(id);
                return Ok(new ApiResponse<object>(200, "Booking cancelled successfully"));
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
                throw new InternalServerException($"Error cancelling booking: {ex.Message}");
            }
        }
    }
}