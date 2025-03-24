using StackExchange.Redis;
using System;
using System.Threading.Tasks;

namespace PRN231ProjectAPI.Services
{

    public class RedisService
    {
        private readonly IDatabase _database;

    
        public async Task BlacklistJtiAsync(string jti)
        {
            await _database.StringSetAsync($"blacklist:{jti}", "true", TimeSpan.FromDays(7));
        }


        public async Task<bool> IsJtiBlacklisted(string jti)
        {
            return await _database.KeyExistsAsync($"blacklist:{jti}");
        }

    }

}
