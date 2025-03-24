// Create a new file: Middleware/AuthenticationMiddleware.cs
using Microsoft.AspNetCore.Http;
using PRN231ProjectAPI.DTOs.Common;
using PRN231ProjectAPI.Exceptions;
using System.Threading.Tasks;
using Microsoft.IdentityModel.Tokens;

namespace PRN231ProjectAPI.Exceptions
{
    public class AuthenticationMiddleware
    {
        private readonly RequestDelegate _next;
        
        public AuthenticationMiddleware(RequestDelegate next)
        {
            _next = next;
        }
        
        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (SecurityTokenExpiredException)
            {
                throw new UnauthorizedException("Token has expired");
            }
            catch (SecurityTokenValidationException)
            {
                throw new UnauthorizedException("Invalid token");
            }
        }
    }

    // Extension method for cleaner Program.cs registration
    public static class AuthenticationMiddlewareExtensions
    {
        public static IApplicationBuilder UseCustomAuthentication(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<AuthenticationMiddleware>();
        }
    }
}