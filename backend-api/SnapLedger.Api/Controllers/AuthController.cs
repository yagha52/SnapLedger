using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SnapLedger.Api.Data;
using SnapLedger.Api.DTOs;
using SnapLedger.Api.Models;
using SnapLedger.Api.Services;
using BCrypt.Net;
using Google.Apis.Auth;

namespace SnapLedger.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly IJwtService _jwt;
    private readonly IConfiguration _config;

    public AuthController(AppDbContext db, IJwtService jwt, IConfiguration config)
    {
        _db = db;
        _jwt = jwt;
        _config = config;
    }

    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterDto dto)
    {
        if (await _db.Users.AnyAsync(u => u.Email == dto.Email))
            return BadRequest(new { message = "Email already in use." });

        var user = new User
        {
            FullName = dto.FullName,
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            AuthProvider = "local"
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();

        var token = _jwt.GenerateToken(user);
        return Ok(new AuthResponseDto(token, new UserDto(user.Id, user.FullName, user.Email, user.AvatarUrl)));
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginDto dto)
    {
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email && u.AuthProvider == "local");
        if (user == null || !BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            return Unauthorized(new { message = "Invalid email or password." });

        var token = _jwt.GenerateToken(user);
        return Ok(new AuthResponseDto(token, new UserDto(user.Id, user.FullName, user.Email, user.AvatarUrl)));
    }

    [HttpPost("google")]
    public async Task<IActionResult> GoogleAuth([FromBody] GoogleAuthDto dto)
    {
        try
        {
            var payload = await GoogleJsonWebSignature.ValidateAsync(dto.IdToken, new GoogleJsonWebSignature.ValidationSettings
            {
                Audience = new[] { _config["Google:ClientId"] }
            });

            var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == payload.Email);

            if (user == null)
            {
                user = new User
                {
                    FullName = payload.Name,
                    Email = payload.Email,
                    GoogleId = payload.Subject,
                    AvatarUrl = payload.Picture,
                    AuthProvider = "google"
                };
                _db.Users.Add(user);
                await _db.SaveChangesAsync();
            }

            var token = _jwt.GenerateToken(user);
            return Ok(new AuthResponseDto(token, new UserDto(user.Id, user.FullName, user.Email, user.AvatarUrl)));
        }
        catch (Exception ex)
        {
            return Unauthorized(new { message = "Invalid Google token.", detail = ex.Message });
        }
    }
}
