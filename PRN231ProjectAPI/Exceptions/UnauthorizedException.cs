namespace PRN231ProjectAPI.Exceptions;

public class UnauthorizedException : AppException
{
    public UnauthorizedException() : base("Unauthorized access", 401) { }

    public UnauthorizedException(string message) : base(message, 401) { }
}