namespace SnapLedger.Api.DTOs;

// Auth DTOs
public record RegisterDto(string FullName, string Email, string Password);
public record LoginDto(string Email, string Password);
public record GoogleAuthDto(string IdToken);
public record AuthResponseDto(string Token, UserDto User);

// User DTOs
public record UserDto(int Id, string FullName, string Email, string? AvatarUrl);

// Invoice DTOs
public record CreateInvoiceDto(
    string? MerchantName,
    decimal? TotalAmount,
    string Currency,
    DateTime? InvoiceDate,
    string? Category,
    string? Notes
);

public record UpdateInvoiceDto(
    string? MerchantName,
    decimal? TotalAmount,
    string? Currency,
    DateTime? InvoiceDate,
    string? Category,
    string? Notes
);

public record InvoiceDto(
    int Id,
    string? MerchantName,
    decimal? TotalAmount,
    string Currency,
    DateTime? InvoiceDate,
    string? Category,
    string? ImageUrl,
    string? Notes,
    DateTime CreatedAt
);

public record ScanResultDto(
    string? MerchantName,
    decimal? TotalAmount,
    string? Currency,
    DateTime? InvoiceDate,
    string? Category,
    string RawText,
    string ImageUrl
);

// Analytics DTOs
public record MonthlySpendingDto(string Month, decimal Total);
public record CategorySpendingDto(string Category, decimal Total);
public record AnalyticsDto(
    List<MonthlySpendingDto> MonthlySpending,
    List<CategorySpendingDto> CategoryBreakdown,
    decimal TotalThisMonth,
    int TotalInvoices
);
