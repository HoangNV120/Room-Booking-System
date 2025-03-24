namespace PRN231ProjectAPI.Exceptions;

public class NotFoundException : AppException
{
    public NotFoundException() : base("Resource not found", 404) { }

    public NotFoundException(string message) : base(message, 404) { }
}