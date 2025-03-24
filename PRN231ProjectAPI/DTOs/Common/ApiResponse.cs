namespace PRN231ProjectAPI.DTOs.Common
{
    public class ApiResponse<T>
    {
        public int Status { get; set; } 
        public string Message { get; set; } 
        public T? Data { get; set; }

        public ApiResponse( T? data = default)
        {
            Status = 200;
            Message = "SUCCESSFULLY";
            Data = data;
        }
        
        public ApiResponse(int status, string message, T? data = default)
        {
            Status = status;
            Message = message;
            Data = data;
        }
    }

}
