namespace Orca.Identity.Application.Auth;

// Requisição de login
public record LoginRequestDto(
    string Username,  // Username ou Email
    string Password   // Password
);

// Resposta de login
public record LoginResponseDto(
    string SessionToken,          // JWT de sessão
    UserInfoDto User,
    DateTime ExpiresAtUtc
);

// Dados do usuário
public record UserInfoDto(
    Guid Id,
    string Username,
    string Email,
    List<RoleInfoDto> Roles,
    List<string> LdapGroups
);

// Info de role
public record RoleInfoDto(
    Guid Id,
    string Name,
    string AccessType
);

// Logout
public record LogoutResponseDto(
    bool Success,
    string Message
);