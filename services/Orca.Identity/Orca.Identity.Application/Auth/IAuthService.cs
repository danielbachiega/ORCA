namespace Orca.Identity.Application.Auth;

public interface IAuthService
{
    Task<LoginResponseDto> LoginAsync(LoginRequestDto request);
    Task LogoutAsync(Guid userId);
    Task<UserInfoDto?> GetCurrentUserAsync(Guid userId);
}