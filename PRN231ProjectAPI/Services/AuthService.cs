using AutoMapper;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using PRN231ProjectAPI.DTOs.Auth;
using PRN231ProjectAPI.Models;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Google.Apis.Auth;

namespace PRN231ProjectAPI.Services
{
   

    public class AuthService
    {
        private readonly HotelBookingDBContext _context;
        private readonly RedisService _redisService;
        private readonly IMapper _mapper;
        private readonly IConfiguration _config;

        public AuthService(HotelBookingDBContext context, RedisService redisService, IMapper mapper, IConfiguration config)
        {
            _context = context;
            _redisService = redisService;
            _mapper = mapper;
            _config = config;
        }

        public async Task<LoginResponseDto?> Login(LoginRequestDTO request)
        {
            var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == request.Email);
            if (user == null || !BCrypt.Net.BCrypt.Verify(request.Password, user.PasswordHash))
                return null;

            var accessToken = GenerateAccessToken(user);
            var refreshToken = GenerateRefreshToken(user);

            return new LoginResponseDto
            {
                AccessToken = accessToken,
                RefreshToken = refreshToken,
                ExpiresIn = 3600,
                UserId = user.Id
            };
        }

        public async Task<SignUpResponseDTO?> SignUp(SignUpRequestDTO request)
        {
            if (await _context.Users.AnyAsync(u => u.Email == request.Email))
                return null;

            var user = _mapper.Map<User>(request);
            user.PasswordHash = BCrypt.Net.BCrypt.HashPassword(request.Password);
            user.Role = "Customer";
            user.CreatedAt = DateTime.UtcNow;

            _context.Users.Add(user);
            await _context.SaveChangesAsync();
    
            return _mapper.Map<SignUpResponseDTO>(user);
        }

        public async Task<RefreshTokenResponseDTO?> Refresh(RefreshTokenRequestDTO request)
        {
            var handler = new JwtSecurityTokenHandler();
            var token = handler.ReadJwtToken(request.RefreshToken);
            var jti = token.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Jti)?.Value;
            var principal = ValidateToken(request.RefreshToken);

            if (principal == null)
                return null;

            if (!string.IsNullOrEmpty(jti) && await _redisService.IsJtiBlacklisted(jti))
                return null;

            var user = await _context.Users.FindAsync(Guid.Parse(request.UserId));
            if (user == null)
                return null;

            var newAccessToken = GenerateAccessToken(user);
            var newRefreshToken = GenerateRefreshToken(user);   

            return new RefreshTokenResponseDTO
            {
                AccessToken = newAccessToken,
                RefreshToken = newRefreshToken,
                Expiration = 3600
            };
        }


        public async Task Logout(LogoutRequestDTO request)
        {
            var handler = new JwtSecurityTokenHandler();
            var token = handler.ReadJwtToken(request.RefreshToken);
            var jti = token.Claims.FirstOrDefault(c => c.Type == JwtRegisteredClaimNames.Jti)?.Value;

            if (!string.IsNullOrEmpty(jti))
            {
                await _redisService.BlacklistJtiAsync(jti);
            }
        }


        private string GenerateAccessToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
            var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(ClaimTypes.Role, user.Role)
        };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(60),
                signingCredentials: credentials
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        private string GenerateRefreshToken(User user)
        {
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(_config["Jwt:Key"]));
            var credentials = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new List<Claim>
        {
            new Claim(ClaimTypes.NameIdentifier, user.Id.ToString()),
            new Claim(JwtRegisteredClaimNames.Jti, Guid.NewGuid().ToString())
        };

            var token = new JwtSecurityToken(
                issuer: _config["Jwt:Issuer"],
                audience: _config["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddDays(7),
                signingCredentials: credentials
            );

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
                var principal = tokenHandler.ValidateToken(token, validationParams, out SecurityToken validatedToken);

                if (validatedToken is not JwtSecurityToken jwtToken || jwtToken.Header.Alg != SecurityAlgorithms.HmacSha256)
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
                var payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken, new GoogleJsonWebSignature.ValidationSettings());

                // Check if user exists by email
                var user = await _context.Users.FirstOrDefaultAsync(u => u.Email == payload.Email);
                var isNewUser = false;

                // If user doesn't exist, create one
                if (user == null)
                {
                    user = new User
                    {
                        Id = Guid.NewGuid(),
                        FullName = payload.Name,
                        Email = payload.Email,
                        PasswordHash = BCrypt.Net.BCrypt.HashPassword(Guid.NewGuid().ToString()), // Random password
                        Role = "Customer",
                        CreatedAt = DateTime.UtcNow,
                        GoogleId = payload.Subject, // Store Google's unique user ID
                        IsExternalLogin = true
                    };

                    _context.Users.Add(user);
                    await _context.SaveChangesAsync();
                    isNewUser = true;
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
                    ExpiresIn = 3600,
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
    
            if (user == null)
                return null;
        
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

    }

}
