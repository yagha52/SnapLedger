namespace SnapLedger.Api.Services;

public interface IVisionService
{
    Task<string> ExtractTextFromImageAsync(string imageUrl);
    (string? Merchant, decimal? Total, string? Currency, DateTime? Date, string? Category) ParseOcrText(string rawText);
}

public class VisionService : IVisionService
{
    private readonly IConfiguration _config;
    private readonly HttpClient _httpClient;

    public VisionService(IConfiguration config, HttpClient httpClient)
    {
        _config = config;
        _httpClient = httpClient;
    }

    public async Task<string> ExtractTextFromImageAsync(string imageUrl)
    {
        var apiKey = _config["OcrSpace:ApiKey"];
        
        var formData = new MultipartFormDataContent();
        formData.Add(new StringContent(imageUrl), "url");
        formData.Add(new StringContent("eng"), "language");
        formData.Add(new StringContent("true"), "isOverlayRequired");
        formData.Add(new StringContent("true"), "detectOrientation");
        formData.Add(new StringContent("2"), "OCREngine");

        _httpClient.DefaultRequestHeaders.Remove("apikey");
        _httpClient.DefaultRequestHeaders.Add("apikey", apiKey);

        var response = await _httpClient.PostAsync("https://api.ocr.space/parse/image", formData);

        if (!response.IsSuccessStatusCode)
        {
            var error = await response.Content.ReadAsStringAsync();
            throw new Exception($"OCR.space API failed: {error}");
        }

        var json = await response.Content.ReadFromJsonAsync<System.Text.Json.JsonElement>();
        
        if (json.TryGetProperty("ParsedResults", out var results) && results.GetArrayLength() > 0)
        {
            return results[0].GetProperty("ParsedText").GetString() ?? string.Empty;
        }

        return string.Empty;
    }

    public (string? Merchant, decimal? Total, string? Currency, DateTime? Date, string? Category) ParseOcrText(string rawText)
    {
        var lines = rawText.Split('\n', StringSplitOptions.RemoveEmptyEntries)
                           .Select(l => l.Trim())
                           .Where(l => l.Length > 1)
                           .ToArray();

        // --- Merchant: first meaningful non-number line ---
        var merchant = lines.FirstOrDefault(l => !System.Text.RegularExpressions.Regex.IsMatch(l, @"^\d"))?.Trim();

        // --- Currency: detect FIRST, before touching amounts ---
        string currency = "USD";
        if (rawText.Contains("LBP", StringComparison.OrdinalIgnoreCase) ||
            rawText.Contains("L.L", StringComparison.OrdinalIgnoreCase) ||
            rawText.Contains("LL ", StringComparison.OrdinalIgnoreCase))
            currency = "LBP";
        else if (rawText.Contains("USD", StringComparison.OrdinalIgnoreCase) || rawText.Contains("$"))
            currency = "USD";
        else if (rawText.Contains("EUR", StringComparison.OrdinalIgnoreCase) || rawText.Contains("€"))
            currency = "EUR";
        else if (rawText.Contains("GBP", StringComparison.OrdinalIgnoreCase) || rawText.Contains("£"))
            currency = "GBP";
        else if (rawText.Contains("AED", StringComparison.OrdinalIgnoreCase))
            currency = "AED";

        // --- Total: search total/amount lines, strip currency codes, extract largest number ---
        decimal? total = null;
        var totalKeywords = new[] { "total", "amount due", "grand total", "net total", "to pay", "balance due", "مجموع", "الإجمالي" };

        // Regex handles: 1,500,000 | 15.50 | 150000 | 1500
        var numberRegex = new System.Text.RegularExpressions.Regex(@"\d{1,3}(?:[,،]\d{3})*(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?");

        foreach (var line in lines)
        {
            var lower = line.ToLower();
            if (totalKeywords.Any(k => lower.Contains(k)))
            {
                // Strip currency words so they aren't mistaken for numbers
                var cleanLine = System.Text.RegularExpressions.Regex.Replace(line, @"\b(LBP|USD|EUR|GBP|AED|LL|L\.L)\b", "", System.Text.RegularExpressions.RegexOptions.IgnoreCase);
                var matches = numberRegex.Matches(cleanLine);
                if (matches.Count > 0)
                {
                    // Take the largest number on the line (most likely the total, not a quantity)
                    decimal best = 0;
                    foreach (System.Text.RegularExpressions.Match m in matches)
                    {
                        var numStr = m.Value.Replace(",", "").Replace("،", "");
                        if (decimal.TryParse(numStr, System.Globalization.NumberStyles.Any,
                            System.Globalization.CultureInfo.InvariantCulture, out var parsed) && parsed > best)
                            best = parsed;
                    }
                    if (best > 0) { total = best; break; }
                }
            }
        }

        // Fallback: if still no total found, take the largest number in the whole text
        if (total == null)
        {
            var allNums = numberRegex.Matches(
                System.Text.RegularExpressions.Regex.Replace(rawText, @"\b(LBP|USD|EUR|GBP|AED|LL|L\.L)\b", "", System.Text.RegularExpressions.RegexOptions.IgnoreCase));
            decimal best = 0;
            foreach (System.Text.RegularExpressions.Match m in allNums)
            {
                var numStr = m.Value.Replace(",", "").Replace("،", "");
                if (decimal.TryParse(numStr, System.Globalization.NumberStyles.Any,
                    System.Globalization.CultureInfo.InvariantCulture, out var parsed) && parsed > best)
                    best = parsed;
            }
            if (best > 0) total = best;
        }

        // --- Date ---
        DateTime? date = null;
        var datePattern = @"\b(\d{1,2}[/\-\.]\d{1,2}[/\-\.]\d{2,4}|\d{4}[/\-\.]\d{1,2}[/\-\.]\d{1,2})\b";
        var dateMatch = System.Text.RegularExpressions.Regex.Match(rawText, datePattern);
        if (dateMatch.Success && DateTime.TryParse(dateMatch.Value, out var parsedDate))
            date = DateTime.SpecifyKind(parsedDate, DateTimeKind.Utc);

        // --- Category ---
        var category = ClassifyCategory(rawText.ToLower());

        return (merchant, total, currency, date, category);
    }

    private static string ClassifyCategory(string text)
    {
        // Food & Dining
        if (text.ContainsAny("restaurant", "cafe", "coffee", "food", "pizza", "burger", "shawarma", "falafel",
            "sandwich", "bakery", "مطعم", "كافيه", "بيتزا", "sushi", "grill", "diner", "snack", "juice",
            "smoothie", "bar ", "pub", "patisserie", "dessert", "ice cream", "fastfood", "fast food"))
            return "Food & Dining";

        // Transport
        if (text.ContainsAny("uber", "careem", "taxi", "fuel", "petrol", "gasoline", "parking", "gas station",
            "transport", "bus", "metro", "railway", "airline", "flight", "محطة", "وقود", "بنزين"))
            return "Transport";

        // Health & Pharmacy
        if (text.ContainsAny("pharmacy", "pharmacie", "hospital", "clinic", "medical", "doctor", "dentist",
            "lab ", "laboratory", "optical", "صيدلية", "مستشفى", "عيادة", "طبيب", "دواء", "drug"))
            return "Health";

        // Shopping & Retail
        if (text.ContainsAny("amazon", "shop", "store", "market", "mall", "retail", "outlet", "boutique",
            "supermarket", "hypermarket", "carrefour", "spinneys", "اسواق", "متجر", "سوبرماركت", "بقالة",
            "grocery", "fashion", "clothing", "electronics"))
            return "Shopping";

        // Travel & Accommodation
        if (text.ContainsAny("hotel", "airbnb", "hostel", "resort", "booking", "airfare", "airport", "موtel",
            "فندق", "حجز"))
            return "Travel";

        // Utilities & Bills
        if (text.ContainsAny("electric", "electricity", "water", "internet", "telephone", "mobile", "phone bill",
            "subscription", "كهرباء", "مياه", "اتصالات", "فاتورة", "invoice", "ogero", "touch", "alfa"))
            return "Utilities";

        // Education
        if (text.ContainsAny("school", "university", "college", "tuition", "course", "training", "مدرسة", "جامعة"))
            return "Education";

        // Entertainment
        if (text.ContainsAny("cinema", "movie", "theatre", "concert", "gym", "sport", "fitness", "netflix",
            "gaming", "entertainment", "سينما", "رياضة"))
            return "Entertainment";

        return "Other";
    }
}

// Extension helper
public static class StringExtensions
{
    public static bool ContainsAny(this string source, params string[] values)
        => values.Any(v => source.Contains(v, StringComparison.OrdinalIgnoreCase));
}


