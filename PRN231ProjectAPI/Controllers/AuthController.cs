using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using PRN231ProjectAPI.DTOs.Auth;
using PRN231ProjectAPI.DTOs.Common;
using PRN231ProjectAPI.Exceptions;
using PRN231ProjectAPI.Services;

namespace PRN231ProjectAPI.Controllers
{
    [Route("api/auth")]
    [ApiController]
    public class AuthController : ControllerBase
    {
        private readonly AuthService _authService;

        public AuthController(AuthService authService)
        {
            _authService = authService;
        }

        [HttpPost("signup")]
        [ProducesResponseType(typeof(ApiResponse<SignUpResponseDTO>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> SignUp([FromBody] SignUpRequestDTO request)
        {
            if (!ModelState.IsValid)
                throw new BadRequestException("Invalid request data");

            var result = await _authService.SignUp(request);
            if (result == null)
                throw new ConflictException("Email already exists");

            return StatusCode(201, new ApiResponse<SignUpResponseDTO>(201, "User registered successfully", result));
        }

        [HttpPost("login")]
        [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Login([FromBody] LoginRequestDTO request)
        {
            if (!ModelState.IsValid)
                throw new BadRequestException("Invalid request data");

            var result = await _authService.Login(request);
            if (result == null)
                throw new UnauthorizedException("Invalid credentials");

            return Ok(new ApiResponse<LoginResponseDto>(200, "Login successful", result));
        }

        [HttpPost("refresh")]
        [ProducesResponseType(typeof(ApiResponse<RefreshTokenResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Refresh([FromBody] RefreshTokenRequestDTO request)
        {
            if (!ModelState.IsValid)
                throw new BadRequestException("Invalid request data");

            var result = await _authService.Refresh(request);
            if (result == null)
                throw new UnauthorizedException("Invalid or expired refresh token");

            return Ok(new ApiResponse<RefreshTokenResponseDTO>(200, "Token refreshed successfully", result));
        }

        [HttpPost("logout")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        public async Task<IActionResult> Logout([FromBody] LogoutRequestDTO request)
        {
            if (!ModelState.IsValid)
                throw new BadRequestException("Invalid request data");

            await _authService.Logout(request);
            return Ok(new ApiResponse<object>(200, "Logged out successfully"));
        }
    }
}