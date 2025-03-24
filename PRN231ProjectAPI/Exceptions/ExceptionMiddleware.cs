using System.Net;
using System.Text.Json;
using PRN231ProjectAPI.DTOs.Common;

namespace PRN231ProjectAPI.Exceptions;

public class ExceptionMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionMiddleware> _logger;
        private readonly IHostEnvironment _environment;

        public ExceptionMiddleware(RequestDelegate next, ILogger<ExceptionMiddleware> logger, IHostEnvironment environment)
        {
            _next = next;
            _logger = logger;
            _environment = environment;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            try
            {
                await _next(context);
            }
            catch (Exception ex)
            {
                await HandleExceptionAsync(context, ex);
            }
        }

        private async Task HandleExceptionAsync(HttpContext context, Exception exception)
        {
            _logger.LogError(exception, exception.Message);

            context.Response.ContentType = "application/json";
            
            int statusCode;
            string message;
            object errorDetail = null;

            switch (exception)
            {
                case AppException ex:
                    statusCode = ex.StatusCode;
                    message = ex.Message;
                    break;

                case KeyNotFoundException:
                    statusCode = (int)HttpStatusCode.NotFound;
                    message = exception.Message;
                    break;

                case UnauthorizedAccessException:
                    statusCode = (int)HttpStatusCode.Unauthorized;
                    message = exception.Message;
                    break;

                default:
                    statusCode = (int)HttpStatusCode.InternalServerError;
                    message = _environment.IsDevelopment() 
                        ? exception.Message 
                        : "An internal server error has occurred.";
                    
                    if (_environment.IsDevelopment())
                    {
                        errorDetail = new
                        {
                            StackTrace = exception.StackTrace,
                            InnerException = exception.InnerException?.Message
                        };
                    }
                    break;
            }

            context.Response.StatusCode = statusCode;

            var response = new ApiResponse<object>(statusCode, message, errorDetail);
            var options = new JsonSerializerOptions { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };
            var json = JsonSerializer.Serialize(response, options);

            await context.Response.WriteAsync(json);
        }
    }

    // Extension method to register the middleware
    public static class ExceptionMiddlewareExtensions
    {
        public static IApplicationBuilder UseExceptionMiddleware(this IApplicationBuilder builder)
        {
            return builder.UseMiddleware<ExceptionMiddleware>();
        }
    }