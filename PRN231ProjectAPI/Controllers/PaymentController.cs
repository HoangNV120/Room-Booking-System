using Microsoft.AspNetCore.Mvc;
using PRN231ProjectAPI.DTOs.Common;
using PRN231ProjectAPI.DTOs.Payment;
using PRN231ProjectAPI.Exceptions;
using PRN231ProjectAPI.Services;
using System;
using System.Threading.Tasks;

namespace PRN231ProjectAPI.Controllers
{
    [Route("api/payments")]
    [ApiController]
    public class PaymentController : ControllerBase
    {
        private readonly PaymentService _paymentService;

        public PaymentController(PaymentService paymentService)
        {
            _paymentService = paymentService;
        }

        [HttpPost]
        [ProducesResponseType(typeof(ApiResponse<VnPayPaymentResponseDTO>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> CreatePayment([FromBody] PaymentCreateDTO request)
        {
            try
            {
                var paymentResponse = await _paymentService.CreateVnPayPayment(request);
                return StatusCode(201, new ApiResponse<VnPayPaymentResponseDTO>(201, "Payment created successfully", paymentResponse));
            }
            catch (BadRequestException ex)
            {
                return BadRequest(new ApiResponse<object>(400, ex.Message));
            }
            catch (Exception ex)
            {
                throw new InternalServerException($"Error creating payment: {ex.Message}");
            }
        }

        [HttpGet("vnpay-callback")]
        [ProducesResponseType(typeof(ApiResponse<PaymentResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ProcessVnPayCallback([FromQuery] PaymentCallbackRequestDTO request)
        {
            try
            {
                var paymentResponse = await _paymentService.ProcessVnPayCallback(request);
                return Ok(new ApiResponse<PaymentResponseDTO>(paymentResponse));
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
    }
}