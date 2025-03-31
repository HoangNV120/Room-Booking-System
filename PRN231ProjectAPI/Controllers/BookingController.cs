using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PRN231ProjectAPI.DTOs.Booking;
using PRN231ProjectAPI.DTOs.Common;
using PRN231ProjectAPI.DTOs.Payment;
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
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
                if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                    throw new UnauthorizedException("Invalid authentication token");
                
                var booking = await _bookingService.GetBookingById(id,userIdClaim);
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

        [HttpGet("my-bookings")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<PagedResponseDTO<BookingResponseDTO>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GetMyBookings([FromQuery] BookingFilterDTO filter)
        {
            try
            {
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
                if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                    throw new UnauthorizedException("Invalid authentication token");
        
                if (filter == null)
                    filter = new BookingFilterDTO();
            
                filter.UserId = userId;
        
                // Get paginated bookings
                var bookings = await _bookingService.GetUserBookings(filter);
                return Ok(new ApiResponse<PagedResponseDTO<BookingResponseDTO>>(bookings));
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
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
                if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                    throw new UnauthorizedException("Invalid authentication token");
                
                request.UserId = userId;
                
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
                var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
        
                if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                    throw new UnauthorizedException("Invalid authentication token");
                
                
                await _bookingService.CancelBooking(id, userIdClaim);
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
        [HttpGet("payment-callback")]
        [ProducesResponseType(typeof(ApiResponse<BookingResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ProcessPaymentCallback([FromQuery] PaymentCallbackRequestDTO request)
        {
            try
            {
                var bookingResponse = await _bookingService.ProcessVnPayCallback(request);
                return Ok(new ApiResponse<BookingResponseDTO>(bookingResponse));
            }
            catch (BadRequestException ex)
            {
                return BadRequest(new ApiResponse<object>(400, ex.Message));
            }
            catch (Exception ex)
            {
                throw new InternalServerException($"Error processing payment callback: {ex.Message}");
            }
        }
        [HttpGet("{id}/payment-url")]
        [Authorize]
        [ProducesResponseType(typeof(ApiResponse<PaymentUrlResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> GetPaymentUrl(Guid id)
        {
            try
            {
                var paymentUrl = await _bookingService.GeneratePaymentUrl(id);
                return Ok(new ApiResponse<PaymentUrlResponseDTO>(paymentUrl));
            }
            catch (NotFoundException ex)
            {
                return NotFound(new ApiResponse<object>(404, ex.Message));
            }
            catch (ConflictException ex)
            {
                return Conflict(new ApiResponse<object>(409, ex.Message));
            }
            catch (Exception ex)
            {
                throw new InternalServerException($"Error generating payment URL: {ex.Message}");
            }
        }
    }
}