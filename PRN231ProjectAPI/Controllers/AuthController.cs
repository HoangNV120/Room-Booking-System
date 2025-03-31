using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
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
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status201Created)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status409Conflict)]
        public async Task<IActionResult> SignUp([FromBody] SignUpRequestDTO request)
        {
            if (!ModelState.IsValid)
                throw new BadRequestException("Invalid request data");

            var result = await _authService.SignUp(request);
            if (result == null)
                throw new ConflictException("Email already exists");
            
            return Ok(new ApiResponse<SignUpResponseDTO>(201, "Verification code sent", result));
        }

        [HttpPost("verify")]
        [ProducesResponseType(typeof(ApiResponse<SignUpResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> VerifyEmail([FromBody] VerificationRequestDTO request)
        {
            if (!ModelState.IsValid)
                throw new BadRequestException("Invalid request data");
        
            var result = await _authService.VerifyRegistration(request);
            if (result == null)
                throw new BadRequestException("Invalid or expired verification code");
        
            return Ok(new ApiResponse<SignUpResponseDTO>(200, "Email verified and registration completed", result));
        }

        [HttpPost("login")]
        [ProducesResponseType(typeof(ApiResponse<LoginResponseDto>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> Login([FromBody] LoginRequestDTO request)
        {
            if (!ModelState.IsValid)
                throw new BadRequestException("Invalid request data");
        
            // Get client IP address
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0";
    
            var result = await _authService.Login(request, ipAddress);
            if (result == null)
                throw new UnauthorizedException("Invalid username or password");

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
        [HttpPost("google-login")]
        [ProducesResponseType(typeof(ApiResponse<ExternalLoginResponseDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
        public async Task<IActionResult> GoogleLogin([FromBody] GoogleLoginRequestDTO request)
        {
            if (!ModelState.IsValid)
                throw new BadRequestException("Invalid request data");

            var result = await _authService.LoginWithGoogle(request);
            if (result == null)
                throw new UnauthorizedException("Invalid Google token");

            return Ok(new ApiResponse<ExternalLoginResponseDTO>(200, "Google login successful", result));
        }
        [HttpGet("user-info")]
        [Authorize] 
        [ProducesResponseType(typeof(ApiResponse<UserInfoDTO>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status404NotFound)]
        public async Task<IActionResult> GetUserInfo()
        {
            // Get user ID from claims
            var userIdClaim = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
    
            if (string.IsNullOrEmpty(userIdClaim) || !Guid.TryParse(userIdClaim, out var userId))
                throw new UnauthorizedException("Invalid authentication token");
        
            var userInfo = await _authService.GetUserInfo(userId);
    
            if (userInfo == null)
                throw new NotFoundException("User not found");
        
            return Ok(new ApiResponse<UserInfoDTO>(200, "User information retrieved successfully", userInfo));
        }
        [HttpPost("forgot-password")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ForgotPassword([FromBody] ForgotPasswordRequestDTO request)
        {
            if (!ModelState.IsValid)
                throw new BadRequestException("Invalid request data");
        
            // Get client IP address
            var ipAddress = HttpContext.Connection.RemoteIpAddress?.ToString() ?? "0.0.0.0";
    
            try
            {
                await _authService.ForgotPassword(request, ipAddress);
                return Ok(new ApiResponse<object>(200, "If your email exists in our system, you will receive password reset instructions"));
            }
            catch (BadRequestException ex)
            {
                return BadRequest(new ApiResponse<object>(400, ex.Message));
            }
        }

        [HttpPost("reset-password")]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status400BadRequest)]
        public async Task<IActionResult> ResetPassword([FromBody] ResetPasswordRequestDTO request)
        {
            if (!ModelState.IsValid)
                throw new BadRequestException("Invalid request data");
        
            var result = await _authService.ResetPassword(request);
    
            if (!result)
                return BadRequest(new ApiResponse<object>(400, "Invalid or expired reset code"));
        
            return Ok(new ApiResponse<object>(200, "Password has been reset successfully"));
        }
        
        [HttpGet("users")]
        [Authorize(Roles = "Admin")]
        [ProducesResponseType(typeof(ApiResponse<PagedResponseDTO<UserInfoDTO>>), StatusCodes.Status200OK)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status401Unauthorized)]
        [ProducesResponseType(typeof(ApiResponse<object>), StatusCodes.Status403Forbidden)]
        public async Task<IActionResult> GetUsers([FromQuery] UserFilterRequestDTO request)
        {
            if (!ModelState.IsValid)
                throw new BadRequestException("Invalid request data");
        
            var users = await _authService.GetUsers(request);
            return Ok(new ApiResponse<PagedResponseDTO<UserInfoDTO>>(200, "Users retrieved successfully", users));
        }
    }
}