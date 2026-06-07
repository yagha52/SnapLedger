using System.Net.Http.Headers;

namespace SnapLedger.Api.Services;

public interface IImageUploadService
{
    Task<string> UploadImageAsync(IFormFile file);
}

public class ImgBBService : IImageUploadService
{
    private readonly IConfiguration _config;
    private readonly HttpClient _httpClient;

    public ImgBBService(IConfiguration config, HttpClient httpClient)
    {
        _config = config;
        _httpClient = httpClient;
    }

    public async Task<string> UploadImageAsync(IFormFile file)
    {
        var apiKey = _config["ImgBB:ApiKey"];
        
        using var stream = file.OpenReadStream();
        using var memoryStream = new MemoryStream();
        await stream.CopyToAsync(memoryStream);
        var base64Image = Convert.ToBase64String(memoryStream.ToArray());

        var content = new MultipartFormDataContent();
        content.Add(new StringContent(base64Image), "image");

        var response = await _httpClient.PostAsync($"https://api.imgbb.com/1/upload?key={apiKey}", content);
        
        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new Exception($"ImgBB upload failed: {error}");
        }

        var json = await response.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        return json.GetProperty("data").GetProperty("url").GetString()!;
    }
}
