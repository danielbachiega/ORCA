namespace Orca.Orchestrator.Application.JobExecutions.Dtos;

public class PagedResultDto<T>
{
    public List<T> Items { get; set; } = [];
    public int Total { get; set; }
    public int Page { get; set; }
    public int PageSize { get; set; }
}