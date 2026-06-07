using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;
using SnapLedger.Api.Data;
using SnapLedger.Api.DTOs;
using SnapLedger.Api.Models;
using SnapLedger.Api.Services;

namespace SnapLedger.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class InvoicesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IImageUploadService _imageUpload;
    private readonly IVisionService _vision;

    public InvoicesController(AppDbContext db, IImageUploadService imageUpload, IVisionService vision)
    {
        _db = db;
        _imageUpload = imageUpload;
        _vision = vision;
    }

    private int GetUserId() =>
        int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

    // GET /api/invoices
    [HttpGet]
    public async Task<IActionResult> GetAll([FromQuery] string? category, [FromQuery] string? search)
    {
        var query = _db.Invoices
            .Where(i => i.UserId == GetUserId())
            .AsQueryable();

        if (!string.IsNullOrEmpty(category))
            query = query.Where(i => i.Category == category);

        if (!string.IsNullOrEmpty(search))
            query = query.Where(i => i.MerchantName != null && i.MerchantName.ToLower().Contains(search.ToLower()));

        var invoices = await query
            .OrderByDescending(i => i.CreatedAt)
            .Select(i => new InvoiceDto(i.Id, i.MerchantName, i.TotalAmount, i.Currency,
                i.InvoiceDate, i.Category, i.ImageUrl, i.Notes, i.CreatedAt))
            .ToListAsync();

        return Ok(invoices);
    }

    // GET /api/invoices/{id}
    [HttpGet("{id}")]
    public async Task<IActionResult> GetById(int id)
    {
        var invoice = await _db.Invoices.FirstOrDefaultAsync(i => i.Id == id && i.UserId == GetUserId());
        if (invoice == null) return NotFound();

        return Ok(new InvoiceDto(invoice.Id, invoice.MerchantName, invoice.TotalAmount,
            invoice.Currency, invoice.InvoiceDate, invoice.Category, invoice.ImageUrl, invoice.Notes, invoice.CreatedAt));
    }

    // POST /api/invoices/scan - upload image, run OCR, return extracted data
    [HttpPost("scan")]
    public async Task<IActionResult> Scan([FromForm] IFormFile image)
    {
        if (image == null || image.Length == 0)
            return BadRequest(new { message = "No image provided." });

        // 1. Upload to ImgBB
        var imageUrl = await _imageUpload.UploadImageAsync(image);

        // 2. Run OCR via Google Cloud Vision
        var rawText = await _vision.ExtractTextFromImageAsync(imageUrl);

        // 3. Parse the raw text
        var (merchant, total, currency, date, category) = _vision.ParseOcrText(rawText);

        return Ok(new ScanResultDto(merchant, total, currency, date, category, rawText, imageUrl));
    }

    // POST /api/invoices - save a scanned & reviewed invoice
    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateInvoiceDto dto)
    {
        var invoice = new Invoice
        {
            UserId = GetUserId(),
            MerchantName = dto.MerchantName,
            TotalAmount = dto.TotalAmount,
            Currency = dto.Currency,
            InvoiceDate = dto.InvoiceDate,
            Category = dto.Category,
            Notes = dto.Notes
        };

        _db.Invoices.Add(invoice);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = invoice.Id },
            new InvoiceDto(invoice.Id, invoice.MerchantName, invoice.TotalAmount, invoice.Currency,
                invoice.InvoiceDate, invoice.Category, invoice.ImageUrl, invoice.Notes, invoice.CreatedAt));
    }

    // POST /api/invoices/save-scanned - save with image URL from scan step
    [HttpPost("save-scanned")]
    public async Task<IActionResult> SaveScanned([FromBody] SaveScannedDto dto)
    {
        var invoice = new Invoice
        {
            UserId = GetUserId(),
            MerchantName = dto.MerchantName,
            TotalAmount = dto.TotalAmount,
            Currency = dto.Currency ?? "USD",
            InvoiceDate = dto.InvoiceDate,
            Category = dto.Category,
            RawOcrText = dto.RawText,
            ImageUrl = dto.ImageUrl,
            Notes = dto.Notes
        };

        _db.Invoices.Add(invoice);
        await _db.SaveChangesAsync();

        return CreatedAtAction(nameof(GetById), new { id = invoice.Id },
            new InvoiceDto(invoice.Id, invoice.MerchantName, invoice.TotalAmount, invoice.Currency,
                invoice.InvoiceDate, invoice.Category, invoice.ImageUrl, invoice.Notes, invoice.CreatedAt));
    }

    // PUT /api/invoices/{id}
    [HttpPut("{id}")]
    public async Task<IActionResult> Update(int id, [FromBody] UpdateInvoiceDto dto)
    {
        var invoice = await _db.Invoices.FirstOrDefaultAsync(i => i.Id == id && i.UserId == GetUserId());
        if (invoice == null) return NotFound();

        invoice.MerchantName = dto.MerchantName ?? invoice.MerchantName;
        invoice.TotalAmount = dto.TotalAmount ?? invoice.TotalAmount;
        invoice.Currency = dto.Currency ?? invoice.Currency;
        invoice.InvoiceDate = dto.InvoiceDate ?? invoice.InvoiceDate;
        invoice.Category = dto.Category ?? invoice.Category;
        invoice.Notes = dto.Notes ?? invoice.Notes;
        invoice.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new InvoiceDto(invoice.Id, invoice.MerchantName, invoice.TotalAmount, invoice.Currency,
            invoice.InvoiceDate, invoice.Category, invoice.ImageUrl, invoice.Notes, invoice.CreatedAt));
    }

    // DELETE /api/invoices/{id}
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var invoice = await _db.Invoices.FirstOrDefaultAsync(i => i.Id == id && i.UserId == GetUserId());
        if (invoice == null) return NotFound();

        _db.Invoices.Remove(invoice);
        await _db.SaveChangesAsync();
        return NoContent();
    }

    // GET /api/invoices/analytics
    [HttpGet("analytics")]
    public async Task<IActionResult> GetAnalytics()
    {
        var userId = GetUserId();
        var allInvoices = await _db.Invoices.Where(i => i.UserId == userId).ToListAsync();

        var monthly = allInvoices
            .Where(i => i.InvoiceDate.HasValue && i.TotalAmount.HasValue)
            .GroupBy(i => i.InvoiceDate!.Value.ToString("yyyy-MM"))
            .Select(g => new MonthlySpendingDto(g.Key, g.Sum(i => i.TotalAmount!.Value)))
            .OrderBy(m => m.Month)
            .ToList();

        var categories = allInvoices
            .Where(i => !string.IsNullOrEmpty(i.Category) && i.TotalAmount.HasValue)
            .GroupBy(i => i.Category!)
            .Select(g => new CategorySpendingDto(g.Key, g.Sum(i => i.TotalAmount!.Value)))
            .OrderByDescending(c => c.Total)
            .ToList();

        var thisMonth = DateTime.UtcNow.ToString("yyyy-MM");
        var totalThisMonth = allInvoices
            .Where(i => i.InvoiceDate.HasValue && i.TotalAmount.HasValue &&
                        i.InvoiceDate.Value.ToString("yyyy-MM") == thisMonth)
            .Sum(i => i.TotalAmount!.Value);

        return Ok(new AnalyticsDto(monthly, categories, totalThisMonth, allInvoices.Count));
    }
}

public record SaveScannedDto(
    string? MerchantName,
    decimal? TotalAmount,
    string? Currency,
    DateTime? InvoiceDate,
    string? Category,
    string? RawText,
    string? ImageUrl,
    string? Notes
);
