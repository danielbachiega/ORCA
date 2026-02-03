using Orca.Identity.Domain.Auth;
using Orca.Identity.Domain.Entities;
using Orca.Identity.Domain.Ldap;
using Orca.Identity.Domain.Repositories;

namespace Orca.Identity.Application.Auth;

public class AuthService : IAuthService
{
    private readonly IOidcValidator _oidcValidator;
    private readonly ILdapClient _ldapClient;
    private readonly IUserRepository _userRepository;
    private readonly IRoleRepository _roleRepository;
    private readonly ISessionTokenGenerator _tokenGenerator;

    public AuthService(
        IOidcValidator oidcValidator,
        ILdapClient ldapClient,
        IUserRepository userRepository,
        IRoleRepository roleRepository,
        ISessionTokenGenerator tokenGenerator)
    {
        _oidcValidator = oidcValidator;
        _ldapClient = ldapClient;
        _userRepository = userRepository;
        _roleRepository = roleRepository;
        _tokenGenerator = tokenGenerator;
    }

    public async Task<LoginResponseDto> LoginAsync(LoginRequestDto request)
    {
        // 1️⃣ Validar credenciais no LDAP
        var isValid = await _ldapClient.ValidateCredentialsAsync(request.Username, request.Password);
        if (!isValid)
        {
            throw new UnauthorizedAccessException("Credenciais inválidas");
        }

        // 2️⃣ Consultar LDAP para obter grupos do usuário
        var ldapGroups = await _ldapClient.GetUserGroupsAsync(request.Username);

        // 3️⃣ Buscar ou criar usuário
        var user = await _userRepository.GetByUsernameAsync(request.Username);
        if (user == null)
        {
            user = new User
            {
                Id = Guid.NewGuid(),
                Username = request.Username,
                Email = $"{request.Username}@orca.local", // Fallback se LDAP não retornar email
                LdapGroups = ldapGroups,
                LastLoginAtUtc = DateTime.UtcNow
            };
            await _userRepository.AddAsync(user);
        }
        else
        {
            // Atualizar grupos LDAP e último login
            user.LdapGroups = ldapGroups;
            user.LastLoginAtUtc = DateTime.UtcNow;
            await _userRepository.UpdateAsync(user);
        }

        // 4️⃣ Mapear grupos LDAP para roles
        var userRoles = new List<Role>();
        foreach (var ldapGroup in ldapGroups)
        {
            var rolesForGroup = await _roleRepository.GetByLdapGroupAsync(ldapGroup);
            userRoles.AddRange(rolesForGroup);
        }

        // Remover duplicatas
        userRoles = userRoles.DistinctBy(r => r.Id).ToList();

        // Salvar IDs das roles no usuário
        user.RoleIds = userRoles.Select(r => r.Id).ToList();
        await _userRepository.UpdateAsync(user);

        // 5️⃣ Gerar JWT de sessão
        var roleNames = userRoles.Select(r => r.Name).ToList();
        var sessionToken = _tokenGenerator.GenerateToken(
            user.Id,
            user.Username,
            roleNames,
            expiresInMinutes: 60
        );

        // 6️⃣ Retornar response
        return new LoginResponseDto(
            SessionToken: sessionToken,
            User: new UserInfoDto(
                Id: user.Id,
                Username: user.Username,
                Email: user.Email,
                Roles: userRoles.Select(r => new RoleInfoDto(r.Id, r.Name, r.AccessType.ToString())).ToList(),
                LdapGroups: user.LdapGroups
            ),
            ExpiresAtUtc: DateTime.UtcNow.AddMinutes(60)
        );
    }

    public async Task LogoutAsync(Guid userId)
    {
        // Por enquanto: apenas marca último logout (opcional)
        var user = await _userRepository.GetByIdAsync(userId);
        if (user != null)
        {
            // Poderia adicionar LastLogoutAtUtc, mas não é obrigatório
            // Logout real é feito no frontend (remover token)
        }
    }

    public async Task<UserInfoDto?> GetCurrentUserAsync(Guid userId)
    {
        var user = await _userRepository.GetByIdAsync(userId);
        if (user == null)
            return null;

        // Buscar roles do usuário
        var roles = new List<Role>();
        foreach (var roleId in user.RoleIds)
        {
            var role = await _roleRepository.GetByIdAsync(roleId);
            if (role != null)
                roles.Add(role);
        }

        return new UserInfoDto(
            Id: user.Id,
            Username: user.Username,
            Email: user.Email,
            Roles: roles.Select(r => new RoleInfoDto(r.Id, r.Name, r.AccessType.ToString())).ToList(),
            LdapGroups: user.LdapGroups
        );
    }
}