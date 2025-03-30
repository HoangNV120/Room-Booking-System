using System.Net;
using System.Security.Cryptography;
using System.Text;
using PRN231ProjectAPI.Services;

namespace PRN231ProjectAPI.Utils;

public class VnPayLibrary
        {
            private readonly SortedList<string, string> _requestData = new SortedList<string, string>(new VnPayComparer());
            
            public void AddRequestData(string key, string value)
            {
                if (!string.IsNullOrEmpty(value))
                {
                    _requestData.Add(key, value);
                }
            }

            public string CreateRequestUrl(string baseUrl, string secretKey)
            {
                var data = new StringBuilder();
                
                foreach (var kv in _requestData)
                {
                    if (!string.IsNullOrEmpty(kv.Value))
                    {
                        data.Append(WebUtility.UrlEncode(kv.Key) + "=" + WebUtility.UrlEncode(kv.Value) + "&");
                    }
                }
                
                var queryString = data.ToString();
                
                baseUrl += "?" + queryString;
                var signData = queryString;
                if (signData.Length > 0)
                {
                    signData = signData.Remove(signData.Length - 1, 1);
                }
                
                var vnpSecureHash = ComputeHmacSha512(secretKey, signData);
                baseUrl += "vnp_SecureHash=" + vnpSecureHash;
                
                return baseUrl;
            }

            private string ComputeHmacSha512(string key, string data)
            {
                var keyBytes = Encoding.UTF8.GetBytes(key);
                var messageBytes = Encoding.UTF8.GetBytes(data);
                
                using var hmac = new HMACSHA512(keyBytes);
                var hashBytes = hmac.ComputeHash(messageBytes);
                
                var sb = new StringBuilder();
                foreach (var b in hashBytes)
                {
                    sb.Append(b.ToString("x2"));
                }
                
                return sb.ToString();
            }
        }
        