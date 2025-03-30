using System.Text.Json;
using Microsoft.Extensions.Caching.Distributed;
using PRN231ProjectAPI.DTOs.Auth;

namespace PRN231ProjectAPI.Services;

public class RedisService
{
    private readonly IDistributedCache _cache;

    public RedisService(IDistributedCache cache)
    {
        _cache = cache ?? throw new ArgumentNullException(nameof(cache), "Distributed cache cannot be null");
    }

    public async Task BlacklistJtiAsync(string jti)
    {
        if (string.IsNullOrEmpty(jti))
            return;

        await _cache.SetStringAsync(
            $"blacklist:{jti}",
            "true",
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromDays(1)
            });
    }

    public async Task<bool> IsJtiBlacklisted(string jti)
    {
        if (string.IsNullOrEmpty(jti))
            return false;

        var value = await _cache.GetStringAsync($"blacklist:{jti}");
        return value != null;
    }

    // Cache registration data with verification code
    public async Task CacheRegistrationDataAsync(SignUpRequestDTO userData, string verificationCode)
    {
        if (userData == null || string.IsNullOrEmpty(verificationCode))
            return;

        var userJson = JsonSerializer.Serialize(userData);
        await _cache.SetStringAsync(
            $"registration:{userData.Email}",
            userJson,
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15)
            });

        // Store verification code separately
        await _cache.SetStringAsync(
            $"verification:{userData.Email}",
            verificationCode,
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15)
            });
    }

    // Get registration data by email
    public async Task<SignUpRequestDTO> GetRegistrationDataAsync(string email)
    {
        var userJson = await _cache.GetStringAsync($"registration:{email}");
        if (string.IsNullOrEmpty(userJson))
            return null;

        return JsonSerializer.Deserialize<SignUpRequestDTO>(userJson);
    }

    // Get verification code by email
    public async Task<string> GetVerificationCodeAsync(string email)
    {
        return await _cache.GetStringAsync($"verification:{email}");
    }

    // Remove registration data and verification code
    public async Task RemoveRegistrationDataAsync(string email)
    {
        await _cache.RemoveAsync($"registration:{email}");
        await _cache.RemoveAsync($"verification:{email}");
    }

    // In RedisService.cs, add these methods
    public async Task StorePasswordResetCodeAsync(string email, string resetCode)
    {
        if (string.IsNullOrEmpty(email) || string.IsNullOrEmpty(resetCode))
            return;

        await _cache.SetStringAsync(
            $"password_reset:{email}",
            resetCode,
            new DistributedCacheEntryOptions
            {
                AbsoluteExpirationRelativeToNow = TimeSpan.FromMinutes(15)
            });
    }

    public async Task<string> GetPasswordResetCodeAsync(string email)
    {
        return await _cache.GetStringAsync($"password_reset:{email}");
    }

    public async Task RemovePasswordResetCodeAsync(string email)
    {
        await _cache.RemoveAsync($"password_reset:{email}");
    }
}