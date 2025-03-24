namespace PRN231ProjectAPI.Exceptions;

public class ConflictException : AppException
{
    public ConflictException() : base("Conflict occurred", 409) { }

    public ConflictException(string message) : base(message, 409) { }
}