using Microsoft.AspNetCore.Mvc;
using Orca.Identity.Application.Roles;

namespace Orca.Identity.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class RolesController : ControllerBase
{
    private readonly IRoleService _roleService;
    private readonly ILogger<RolesController> _logger;

    public RolesController(IRoleService roleService, ILogger<RolesController> logger)
    {
        _roleService = roleService;
        _logger = logger;
    }

    /// <summary>
    /// Lista todas as roles
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<List<RoleSummaryDto>>> GetAll()
    {
        var roles = await _roleService.GetAllAsync();
        return Ok(roles);
    }

    /// <summary>
    /// Busca role por ID
    /// </summary>
    [HttpGet("{id:guid}")]
    public async Task<ActionResult<RoleDetailsDto>> GetById(Guid id)
    {
        var role = await _roleService.GetByIdAsync(id);
        if (role == null)
            return NotFound(new { message = $"Role com ID {id} não encontrada" });

        return Ok(role);
    }

    /// <summary>
    /// Busca role por nome
    /// </summary>
    [HttpGet("by-name/{name}")]
    public async Task<ActionResult<RoleSummaryDto>> GetByName(string name)
    {
        var role = await _roleService.GetByNameAsync(name);
        if (role == null)
            return NotFound(new { message = $"Role '{name}' não encontrada" });

        return Ok(role);
    }

    /// <summary>
    /// Busca roles por grupo LDAP
    /// </summary>
    [HttpGet("by-ldap-group/{ldapGroup}")]
    public async Task<ActionResult<List<RoleSummaryDto>>> GetByLdapGroup(string ldapGroup)
    {
        var roles = await _roleService.GetByLdapGroupAsync(ldapGroup);
        return Ok(roles);
    }

    /// <summary>
    /// Cria uma nova role
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<RoleDetailsDto>> Create([FromBody] CreateRoleDto dto)
    {
            var role = await _roleService.CreateAsync(dto);
            return CreatedAtAction(nameof(GetById), new { id = role.Id }, role);
    }

    /// <summary>
    /// Atualiza uma role existente
    /// </summary>
    [HttpPut("{id:guid}")]
    public async Task<ActionResult<RoleDetailsDto>> Update(Guid id, [FromBody] UpdateRoleDto dto)
    {
            var role = await _roleService.UpdateAsync(id, dto);
            return Ok(role);
    }

    /// <summary>
    /// Deleta uma role
    /// </summary>
    [HttpDelete("{id:guid}")]
    public async Task<ActionResult> Delete(Guid id)
    {
            await _roleService.DeleteAsync(id);
            return NoContent();
    }
}