namespace PRN231ProjectAPI.Exceptions;

public class ForbiddenException : AppException
{
    public ForbiddenException() : base("Forbidden", 403) { }

    public ForbiddenException(string message) : base(message, 403) { }
}
