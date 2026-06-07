using System.ComponentModel.DataAnnotations;

namespace SnapLedger.Api.Models;

public class User
{
    public int Id { get; set; }

    [Required, MaxLength(100)]
    public string FullName { get; set; } = string.Empty;

    [Required, MaxLength(255)]
    public string Email { get; set; } = string.Empty;

    // Null for Google OAuth users (they don't have a password)
    public string? PasswordHash { get; set; }

    // "local" or "google"
    public string AuthProvider { get; set; } = "local";

    public string? GoogleId { get; set; }

    public string? AvatarUrl { get; set; }

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    // Navigation property
    public ICollection<Invoice> Invoices { get; set; } = new List<Invoice>();
}
