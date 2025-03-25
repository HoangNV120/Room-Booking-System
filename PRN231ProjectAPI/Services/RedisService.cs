using StackExchange.Redis;
using System;
using System.Threading.Tasks;

namespace PRN231ProjectAPI.Services
{
    public class RedisService
    {
        private readonly IDatabase _database;

        public RedisService(ConnectionMultiplexer redis)
        {
            _database = redis?.GetDatabase() ?? 
                        throw new ArgumentNullException(nameof(redis), "Redis connection multiplexer cannot be null");
        }

        public async Task BlacklistJtiAsync(string jti)
        {
            if (string.IsNullOrEmpty(jti))
                return;

            await _database.StringSetAsync(
                $"blacklist:{jti}", 
                "true", 
                TimeSpan.FromDays(7));
        }

        public async Task<bool> IsJtiBlacklisted(string jti)
        {
            if (string.IsNullOrEmpty(jti))
                return false;

            return await _database.KeyExistsAsync($"blacklist:{jti}");
        }
    }
}