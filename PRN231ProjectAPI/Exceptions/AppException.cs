namespace PRN231ProjectAPI.Exceptions;

public class AppException : Exception
{
    public int StatusCode { get; set; } = 500;

    public AppException() : base() { }

    public AppException(string message) : base(message) { }

    public AppException(string message, int statusCode) : base(message)
    {
        StatusCode = statusCode;
    }
}