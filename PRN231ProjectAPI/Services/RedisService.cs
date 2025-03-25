using Microsoft.Extensions.Caching.Distributed;
using System;
using System.Threading.Tasks;

namespace PRN231ProjectAPI.Services
{
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
    }
}