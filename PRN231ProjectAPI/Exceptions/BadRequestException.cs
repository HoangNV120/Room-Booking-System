namespace PRN231ProjectAPI.Exceptions;

public class BadRequestException : AppException
{
    public BadRequestException() : base("Bad request", 400) { }

    public BadRequestException(string message) : base(message, 400) { }
}