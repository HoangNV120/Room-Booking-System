using System.ComponentModel.DataAnnotations;
using System.Text.RegularExpressions;

namespace PRN231ProjectAPI.Attributes
{
    public class StrongPasswordAttribute : ValidationAttribute
    {
        protected override ValidationResult IsValid(object value, ValidationContext validationContext)
        {
            var password = value as string;
            
            if (string.IsNullOrWhiteSpace(password))
                return new ValidationResult("Password cannot be empty.");
                
            if (password.Length < 8)
                return new ValidationResult("Password must be at least 8 characters long.");
                
            var regex = new Regex(@"^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^\da-zA-Z]).{8,}$");
            
            if (!regex.IsMatch(password))
                return new ValidationResult("Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character.");
                
            return ValidationResult.Success;
        }
    }
}