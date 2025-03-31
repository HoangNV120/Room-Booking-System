using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using AutoMapper;
using Google.Apis.Auth;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PRN231ProjectAPI.DTOs.Auth;
using PRN231ProjectAPI.DTOs.Common;
using PRN231ProjectAPI.Exceptions;
using PRN231ProjectAPI.Models;
using PRN231ProjectAPI.Utils;

namespace PRN231ProjectAPI.Services;

public class AuthService
{
    private readonly IConfiguration _config;
    private readonly HotelBookingDBContext _context;
    private readonly EmailService _emailService;
    private readonly IMapper _mapper;
    private readonly RedisService _redisService;
    private readonly TurnstileService _turnstileService;

    public AuthService(HotelBookingDBContext context, RedisService redisService, IMapper mapper,
        IConfiguration config, EmailService emailService, TurnstileService turnstileService)
    {
        _context = context;
        _redisService = redisService;
        _mapper = mapper;
        _config = config;
        _emailService = emailService;
        _turnstileService = turnstileService;
    }

    public async Task<LoginResponseDto?> Login(LoginRequestDTO request, string ipAddress)
    {
        // Validate Turnstile token first
        var isValidToken = await _turnstileService.ValidateTokenAsync(request.TurnstileToken, ipAddress);
        if (!isValidToken) throw new BadRequestException("CAPTCHA verification failed");

        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash)) return null;

        var accessToken = GenerateAccessToken(user);
        var refreshToken = GenerateRefreshToken(user);

        return new LoginResponseDto
        {
            AccessToken = accessToken, RefreshToken = refreshToken, ExpiresIn = 900, UserId = user.Id
        };
    }

    public async Task<SignUpResponseDTO> SignUp(SignUpRequestDTO request)
    {
        if (await _context.Users.AnyAsync(u => u.Email == request.Email))
            throw new ConflictException($"Email {request.Email} already exists");

        var verificationCode = Guid.NewGuid().ToString();
        await _redisService.CacheRegistrationDataAsync(request, verificationCode);

        // Send verification email
        var subject = "Email Verification";
        var verificationLink =
            $"http://localhost:3000/verify/{verificationCode}?email={Uri.EscapeDataString(request.Email)}";
        var message = $"Please click the link below to verify your email address:\n\n{verificationLink}";
        await _emailService.SendEmailAsync(request.Email, subject, message);

        return new SignUpResponseDTO { Email = request.Email };
    }

    public async Task<SignUpResponseDTO> VerifyRegistration(VerificationRequestDTO request)
    {
        // Retrieve stored verification code
        var storedCode = await _redisService.GetVerificationCodeAsync(request.Email);

        // Check if code is valid
        if (string.IsNullOrEmpty(storedCode) || storedCode != request.Code) return null;

        // Get registration data
        var userData = await _redisService.GetRegistrationDataAsync(request.Email);
        if (userData == null) return null;

        // Create the user in the database
        var user = _mapper.Map<User>(userData);
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(userData.Password);
        user.Role = "Customer";
        user.CreatedAt = DateTime.Now;

        _context.Users.Add(user);
        await _context.SaveChangesAsync();

        // Remove registration data from Redis
        await _redisService.RemoveRegistrationDataAsync(request.Email);

        return _mapper.Map<SignUpResponseDTO>(user);
    }

    public async Task<RefreshTokenResponseDTO?> Refresh(RefreshTokenRequestDTO request)
    {
        var handler = new JwtSecurityTokenHandler();
        var token = handler.ReadJwtToken(request.RefreshToken);

        // Extract JTI and expiration time from the original token
        var jti = token.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Jti)?.Value;
        var originalExpiration = token.ValidTo;

        var principal = ValidateToken(request.RefreshToken);

        if (principal == null) return null;

        if (!string.IsNullOrEmpty(jti) && await _redisService.IsJtiBlacklisted(jti)) return null;

        var user = await _context.Users.FindAsync(Guid.Parse(request.UserId));
        if (user == null) return null;

        // Blacklist the current refresh token so it can't be used again
        if (!string.IsNullOrEmpty(jti)) await _redisService.BlacklistJtiAsync(jti);

        // Generate new access token and refresh token
        var newAccessToken = GenerateAccessToken(user);
        var newRefreshToken = GenerateRefreshToken(user, originalExpiration);

        return new RefreshTokenResponseDTO
        {
            AccessToken = newAccessToken, RefreshToken = newRefreshToken, Expiration = 900
        };
    }

    public async Task Logout(LogoutRequestDTO request)
    {
        var handler = new JwtSecurityTokenHandler();
        var token = handler.ReadJwtToken(request.RefreshToken);
        var jti = token.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Jti)?.Value;

        if (!string.IsNullOrEmpty(jti)) await _redisService.BlacklistJtiAsync(jti);
    }

    private string GenerateAccessToken(User user)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()), new(ClaimTypes.Role, user.Role)
        };

        var token = new JwtSecurityToken(_config["Jwt:Issuer"], _config["Jwt:Audience"],
            claims, expires: DateTime.Now.AddMinutes(15), signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private string GenerateRefreshToken(User user, DateTime? time = null)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
        var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

        var claims = new List<Claim>
        {
            new(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

        var token = new JwtSecurityToken(_config["Jwt:Issuer"], _config["Jwt:Audience"],
            claims, expires: time ?? DateTime.Now.AddDays(1), signingCredentials: credentials);

        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private ClaimsPrincipal? ValidateToken(string token)
    {
        var tokenHandler = new JwtSecurityTokenHandler();
        var key = Encoding.UTF8.GetBytes(_config["Jwt:Key"]);

        var validationParams = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateIssuerSigningKey = true,
            ValidateLifetime = true,
            ClockSkew = TimeSpan.Zero,
            ValidIssuer = _config["Jwt:Issuer"],
            ValidAudience = _config["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(key)
        };

        try
        {
            var principal = tokenHandler.ValidateToken(token, validationParams, out var validatedToken);

            if (validatedToken is not JwtSecurityToken jwtToken ||
                jwtToken.Header.Alg != SecurityAlgorithms.HmacSha256)
                return null;

            return principal;
        }
        catch (SecurityTokenExpiredException)
        {
            Console.WriteLine("Token đã hết hạn!");
            return null;
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Token không hợp lệ: {ex.Message}");
            return null;
        }
    }

    public async Task<ExternalLoginResponseDTO> LoginWithGoogle(GoogleLoginRequestDTO request)
    {
        try
        {
            // Validate Google token
            var payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken,
                new GoogleJsonWebSignature.ValidationSettings());

            // Check if user exists by email
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == payload.Email);
            var isNewUser = false;

            // If user doesn't exist, create one
            if (user == null)
            {
                // Generate strong password using our utility class
                var randomPassword = PasswordUtils.GenerateStrongPassword();

                user = new User
                {
                    Id = Guid.NewGuid(),
                    FullName = payload.Name,
                    Email = payload.Email,
                    PasswordHash = BCrypt.Net.BCrypt.HashPassword(randomPassword),
                    Role = "Customer",
                    CreatedAt = DateTime.Now,
                    GoogleId = payload.Subject,
                    IsExternalLogin = true
                };

                _context.Users.Add(user);
                await _context.SaveChangesAsync();
                isNewUser = true;

                // Send email with generated password
                var subject = "Your Hotel Booking Account Password";
                var message = $@"
                         <h2>Welcome to our Hotel Booking System!</h2>
                         <p>You have successfully created an account using Google Sign-In.</p>
                         <p>We have generated a secure password for your account:</p>
                         <p style='background-color: #f5f5f5; padding: 10px; font-family: monospace; font-size: 16px;'><strong>{randomPassword}</strong></p>
                         <p>You can continue using Google Sign-In or use this email and password combination to log in directly.</p>
                         <p>For security reasons, we recommend changing this password after your first direct login.</p>
                      ";

                await _emailService.SendEmailAsync(user.Email, subject, message);
            }
            else if (string.IsNullOrEmpty(user.GoogleId))
            {
                // If existing user doesn't have GoogleId, update it
                user.GoogleId = payload.Subject;
                user.IsExternalLogin = true;
                await _context.SaveChangesAsync();
            }

            // Generate tokens
            var accessToken = GenerateAccessToken(user);
            var refreshToken = GenerateRefreshToken(user);

            return new ExternalLoginResponseDTO
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresIn = 900,
                UserId = user.Id,
                IsNewUser = isNewUser
            };
        }
        catch (Exception ex)
        {
            // Log exception
            Console.WriteLine($"Google login error: {ex.Message}");
            return null;
        }
    }

    public async Task<UserInfoDTO> GetUserInfo(Guid userId)
    {
        var user = await _context.Users.FindAsync(userId);

        if (user == null) return null;

        return new UserInfoDTO
        {
            Id = user.Id,
            FullName = user.FullName,
            Email = user.Email,
            Role = user.Role,
            IsExternalLogin = user.IsExternalLogin,
            CreatedAt = user.CreatedAt
        };
    }

    public async Task<bool> ForgotPassword(ForgotPasswordRequestDTO request, string ipAddress)
    {
        // Validate Turnstile token if provided
        if (!string.IsNullOrEmpty(request.TurnstileToken))
        {
            var isValidToken = await _turnstileService.ValidateTokenAsync(request.TurnstileToken, ipAddress);
            if (!isValidToken) throw new BadRequestException("CAPTCHA verification failed");
        }

        // Check if user exists
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null) throw new NotFoundException($"No user found with email: {request.Email}");

        if (user.IsExternalLogin && !string.IsNullOrEmpty(user.GoogleId))
            throw new BadRequestException("Please use Google Sign-In for this account");

        // Generate reset code
        var resetCode = Guid.NewGuid().ToString();

        // Store in Redis
        await _redisService.StorePasswordResetCodeAsync(request.Email, resetCode);

        // Send email
        var subject = "Password Reset Request";
        var resetLink =
            $"http://localhost:3000/verify/forgot/{resetCode}?email={Uri.EscapeDataString(request.Email)}";
        var message = $@"
                <h2>Password Reset Request</h2>
                <p>We received a request to reset your password. If you didn't make this request, you can ignore this email.</p>
                <p>To reset your password, please click the link below:</p>
                <p><a href='{resetLink}'>Reset Your Password</a></p>
                <p>This link will expire in 15 minutes.</p>
                ";

        await _emailService.SendEmailAsync(request.Email, subject, message);

        return true;
    }

    public async Task<bool> ResetPassword(ResetPasswordRequestDTO request)
    {
        // Check if reset code is valid
        var storedCode = await _redisService.GetPasswordResetCodeAsync(request.Email);
        if (string.IsNullOrEmpty(storedCode) || storedCode != request.Code) return false;

        // Find user
        var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
        if (user == null) return false;

        if (user.IsExternalLogin && !string.IsNullOrEmpty(user.GoogleId)) return false;

        // Update password
        user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.NewPassword);
        await _context.SaveChangesAsync();

        // Remove reset code from Redis
        await _redisService.RemovePasswordResetCodeAsync(request.Email);

        return true;
    }
    public async Task<PagedResponseDTO<UserInfoDTO>> GetUsers(UserFilterRequestDTO request)
    {
        // Start with base query
        var query = _context.Users.AsQueryable();
    
        // Apply filters
        if (!string.IsNullOrEmpty(request.FullName))
            query = query.Where(u => u.FullName.Contains(request.FullName));
        
        if (!string.IsNullOrEmpty(request.Email))
            query = query.Where(u => u.Email.Contains(request.Email));
        
        if (!string.IsNullOrEmpty(request.Role))
            query = query.Where(u => u.Role == request.Role);
    
        // Apply sorting by creation date
        query = request.SortOrder.ToLower() == "asc" 
            ? query.OrderBy(u => u.CreatedAt)
            : query.OrderByDescending(u => u.CreatedAt);
    
        // Get total count for pagination
        var totalCount = await query.CountAsync();
    
        // Apply pagination
        var users = await query
            .Skip((request.PageNumber - 1) * request.PageSize)
            .Take(request.PageSize)
            .ToListAsync();
    
        // Map to DTOs
        var userDtos = _mapper.Map<List<UserInfoDTO>>(users);
    
        // Create paged response
        return new PagedResponseDTO<UserInfoDTO>
        {
            Items = userDtos,
            PageNumber = request.PageNumber,
            PageSize = request.PageSize,
            TotalCount = totalCount,
            TotalPages = (int)Math.Ceiling(totalCount / (double)request.PageSize)
        };
    }
}