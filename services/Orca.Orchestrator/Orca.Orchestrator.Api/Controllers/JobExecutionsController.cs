using Microsoft.AspNetCore.Mvc;
using System.Text.Json;
using Orca.Orchestrator.Application.JobExecutions;
using Orca.Orchestrator.Application.JobExecutions.Dtos;
using Orca.Orchestrator.Domain.Entities;
using Orca.Orchestrator.Domain.Repositories;

namespace Orca.Orchestrator.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class JobExecutionsController : ControllerBase
{
    private readonly IJobExecutionService _jobExecutionService;
    private readonly IJobExecutionRepository _repository;
    private readonly ILogger<JobExecutionsController> _logger;

    public JobExecutionsController(
        IJobExecutionService jobExecutionService,
        IJobExecutionRepository repository,
        ILogger<JobExecutionsController> logger)
    {
        _jobExecutionService = jobExecutionService ?? throw new ArgumentNullException(nameof(jobExecutionService));
        _repository = repository ?? throw new ArgumentNullException(nameof(repository));
        _logger = logger ?? throw new ArgumentNullException(nameof(logger));
    }

    /// <summary>
    /// GET /api/job-executions/{id}
    /// Retorna detalhes completos de uma execução
    /// </summary>
    [HttpGet("{id:guid}")]
    [ProducesResponseType(typeof(JobExecutionDetailsDto), StatusCodes.Status200OK)]
    [ProducesResponseType(StatusCodes.Status404NotFound)]
    public async Task<ActionResult<JobExecutionDetailsDto>> GetById(Guid id)
    {
        var execution = await _repository.GetByIdAsync(id);
        
        if (execution == null)
            return NotFound(new { error = $"JobExecution {id} not found" });
        
        return Ok(MapToDetailsDto(execution));
    }

    /// <summary>
    /// GET /api/job-executions/request/{requestId}
    /// Retorna todas execuções de um Request
    /// </summary>
    [HttpGet("request/{requestId:guid}")]
    [ProducesResponseType(typeof(List<JobExecutionListItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<List<JobExecutionListItemDto>>> GetByRequestId(Guid requestId)
    {
        var execution = await _repository.GetByRequestIdAsync(requestId);
        
        if (execution == null)
            return Ok(new List<JobExecutionListItemDto>());
        
        var dtos = new List<JobExecutionListItemDto> { MapToListItemDto(execution) };
        return Ok(dtos);
    }

    /// <summary>
    /// GET /api/job-executions
    /// Lista todas execuções com paginação
    /// </summary>
    [HttpGet]
    [ProducesResponseType(typeof(PagedResultDto<JobExecutionListItemDto>), StatusCodes.Status200OK)]
    public async Task<ActionResult<PagedResultDto<JobExecutionListItemDto>>> GetAll(
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 10)
    {
        if (page < 1 || pageSize < 1)
            return BadRequest(new { error = "Page and PageSize must be >= 1" });

        var (items, total) = await _repository.GetPagedAsync(page, pageSize);
        var dtos = items.Select(MapToListItemDto).ToList();

        return Ok(new PagedResultDto<JobExecutionListItemDto>
        {
            Items = dtos,
            Total = total,
            Page = page,
            PageSize = pageSize
        });
    }

    // 🔄 Métodos privados para mapping
    private JobExecutionDetailsDto MapToDetailsDto(JobExecution execution) => 
        new()
        {
            Id = execution.Id,
            RequestId = execution.RequestId,
            ExecutionTargetType = execution.ExecutionTargetType,
            AwxOoJobId = execution.AwxOoJobId,
            ExecutionStatus = execution.ExecutionStatus == "pending" ? 0 
                            : execution.ExecutionStatus == "running" ? 1 
                            : execution.ExecutionStatus == "success" ? 2 : 3,
            PollingAttempts = execution.PollingAttempts,
            LastPolledAtUtc = execution.LastPolledAtUtc,
            ExecutionPayload = execution.ExecutionPayload != null 
                ? JsonDocument.Parse(execution.ExecutionPayload).RootElement 
                : null,
            ExecutionResponse = execution.ExecutionResponse != null 
                ? JsonDocument.Parse(execution.ExecutionResponse).RootElement 
                : null,
            ErrorMessage = execution.ErrorMessage,
            CreatedAtUtc = execution.CreatedAtUtc,
            CompletedAtUtc = execution.CompletedAtUtc
        };

    private JobExecutionListItemDto MapToListItemDto(JobExecution execution) => 
        new()
        {
            Id = execution.Id,
            RequestId = execution.RequestId,
            ExecutionTargetType = execution.ExecutionTargetType,
            AwxOoJobId = execution.AwxOoJobId,
            ExecutionStatus = execution.ExecutionStatus == "pending" ? 0 
                            : execution.ExecutionStatus == "running" ? 1 
                            : execution.ExecutionStatus == "success" ? 2 : 3,
            PollingAttempts = execution.PollingAttempts,
            LastPolledAtUtc = execution.LastPolledAtUtc,
            CreatedAtUtc = execution.CreatedAtUtc,
            CompletedAtUtc = execution.CompletedAtUtc
        };
}