using System.Text.Json;
using System.Text.Json.Serialization;

namespace PRN231ProjectAPI.Services;

public class TurnstileService
{
    private readonly HttpClient _httpClient;
    private readonly string _secretKey;

    public TurnstileService(HttpClient httpClient, IConfiguration configuration)
    {
        _httpClient = httpClient;
        _secretKey = configuration["Cloudflare:TurnstileSecretKey"];
    }

    public async Task<bool> ValidateTokenAsync(string token, string ipAddress)
    {
        var values = new Dictionary<string, string>
        {
            { "secret", _secretKey },
            { "response", token },
            { "remoteip", ipAddress }
        };

        var content = new FormUrlEncodedContent(values);
        var response =
            await _httpClient.PostAsync("https://challenges.cloudflare.com/turnstile/v0/siteverify", content);

        if (!response.IsSuccessStatusCode)
            return false;

        var responseContent = await response.Content.ReadAsStringAsync();
        var result = JsonSerializer.Deserialize<TurnstileResponse>(responseContent);

        return result?.Success ?? false;
    }

    private class TurnstileResponse
    {
        [JsonPropertyName("success")] public bool Success { get; set; }

        [JsonPropertyName("error-codes")] public string[] ErrorCodes { get; set; }
    }
}