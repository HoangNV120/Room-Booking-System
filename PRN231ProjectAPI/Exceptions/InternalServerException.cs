namespace PRN231ProjectAPI.Exceptions;

public class InternalServerException : AppException
{
    public InternalServerException() : base("Internal server error", 500) { }

    public InternalServerException(string message) : base(message, 500) { }
}