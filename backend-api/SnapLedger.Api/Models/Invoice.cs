using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace SnapLedger.Api.Models;

public class Invoice
{
    public int Id { get; set; }

    [Required]
    public int UserId { get; set; }

    [ForeignKey("UserId")]
    public User User { get; set; } = null!;

    [MaxLength(255)]
    public string? MerchantName { get; set; }

    [Column(TypeName = "decimal(18,2)")]
    public decimal? TotalAmount { get; set; }

    [MaxLength(10)]
    public string Currency { get; set; } = "USD";

    public DateTime? InvoiceDate { get; set; }

    [MaxLength(100)]
    public string? Category { get; set; }

    // Raw OCR text from Google Cloud Vision
    public string? RawOcrText { get; set; }

    // URL of the stored bill image (Cloudinary)
    public string? ImageUrl { get; set; }

    public string? Notes { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}
