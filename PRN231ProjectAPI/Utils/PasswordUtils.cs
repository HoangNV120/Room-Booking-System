using System;
using System.Linq;
using System.Text;

namespace PRN231ProjectAPI.Utils
{
    public static class PasswordUtils
    {
        public static string GenerateStrongPassword(int length = 12)
        {
            const string uppercaseChars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
            const string lowercaseChars = "abcdefghijklmnopqrstuvwxyz";
            const string digitChars = "0123456789";
            const string specialChars = "!@#$%^&*()-_=+[]{}|;:,.<>?";

            var random = new Random();
            var password = new StringBuilder();

            // Add at least one character from each required category
            password.Append(uppercaseChars[random.Next(uppercaseChars.Length)]);
            password.Append(lowercaseChars[random.Next(lowercaseChars.Length)]);
            password.Append(digitChars[random.Next(digitChars.Length)]);
            password.Append(specialChars[random.Next(specialChars.Length)]);

            // Add additional random characters to reach desired length
            const string allChars = uppercaseChars + lowercaseChars + digitChars + specialChars;
            for (int i = 4; i < length; i++) // Already added 4 required chars
            {
                password.Append(allChars[random.Next(allChars.Length)]);
            }

            // Shuffle the password characters to avoid predictable pattern
            return new string(password.ToString().OrderBy(c => random.Next()).ToArray());
        }
    }
}