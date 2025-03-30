using CloudinaryDotNet;
using CloudinaryDotNet.Actions;
using Microsoft.Extensions.Options;
using PRN231ProjectAPI.Config;

namespace PRN231ProjectAPI.Services;

public class ImageService
{
    private readonly Cloudinary _cloudinary;
    private readonly string _folder = "rooms";

    public ImageService(IOptions<CloudinaryConfig> config)
    {
        // Initialize Cloudinary with credentials
        var account = new Account(
            config.Value.CloudName,
            config.Value.ApiKey,
            config.Value.ApiSecret
        );

        _cloudinary = new Cloudinary(account);
    }

    public async Task<bool> DeleteImageAsync(string imageUrl)
    {
        if (string.IsNullOrEmpty(imageUrl))
            return false;

        try
        {
            // Extract public_id from URL
            var uri = new Uri(imageUrl);
            var pathSegments = uri.AbsolutePath.Split('/');
            var version = "";
            var publicId = "";

            // Parse URL to find version and public ID
            for (var i = 0; i < pathSegments.Length; i++)
                if (pathSegments[i].StartsWith("v") && pathSegments[i].Length > 1)
                {
                    version = pathSegments[i];
                    if (i + 1 < pathSegments.Length)
                    {
                        publicId = _folder + "/" + Path.GetFileNameWithoutExtension(pathSegments[i + 1]);
                        break;
                    }
                }

            // Delete the image
            var deleteParams = new DeletionParams(publicId);
            var result = await _cloudinary.DestroyAsync(deleteParams);

            return result.Result == "ok";
        }
        catch (Exception)
        {
            return false;
        }
    }

    public async Task<string> UploadImageAsync(IFormFile image, string? existingImageUrl = null, string? name = null)
    {
        if (image == null || image.Length == 0)
            return string.Empty;

        // Delete existing image if provided
        if (!string.IsNullOrEmpty(existingImageUrl)) await DeleteImageAsync(existingImageUrl);

        await using var stream = image.OpenReadStream();

        // Create upload params with options
        var uploadParams = new ImageUploadParams
        {
            File = new FileDescription(name ?? image.FileName, stream),
            Folder = _folder,
            UseFilename = true,
            UniqueFilename = true,
            Overwrite = true,
            Transformation = new CloudinaryDotNet.Transformation()
                .Width(1000)
                .Crop("scale")
                .Chain()
                .Quality("auto:best")
                .Chain()
                .FetchFormat("auto")
        };

        // If a custom name was provided, use it as the public ID
        if (!string.IsNullOrEmpty(name)) uploadParams.PublicId = name;

        // Execute upload
        var uploadResult = await _cloudinary.UploadAsync(uploadParams);

        // Return secure URL of the uploaded image
        return uploadResult.SecureUrl.ToString();
    }

    public async Task<List<string>> UploadImagesAsync(List<IFormFile> images)
    {
        var uploadTasks = images.Select(image => UploadImageAsync(image)).ToList();
        return (await Task.WhenAll(uploadTasks)).ToList();
    }
}