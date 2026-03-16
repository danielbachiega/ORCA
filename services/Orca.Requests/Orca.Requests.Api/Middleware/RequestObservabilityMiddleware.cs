using System.Diagnostics;

namespace Orca.Requests.Api.Middleware;

public sealed class RequestObservabilityMiddleware
{
    private const string CorrelationHeader = "X-Correlation-Id";
    private readonly RequestDelegate _next;
    private readonly ILogger<RequestObservabilityMiddleware> _logger;

    public RequestObservabilityMiddleware(
        RequestDelegate next,
        ILogger<RequestObservabilityMiddleware> logger)
    {
        _next = next;
        _logger = logger;
    }

    public async Task InvokeAsync(HttpContext context)
        {
            if (context.Request.Path.StartsWithSegments("/health") ||
                context.Request.Path.StartsWithSegments("/swagger") ||
                context.Request.Path.StartsWithSegments("/favicon.ico"))
            {
                await _next(context);
                return;
            }

            var stopwatch = Stopwatch.StartNew();

            var correlationId = context.Request.Headers.TryGetValue(CorrelationHeader, out var incoming)
                && !string.IsNullOrWhiteSpace(incoming)
                ? incoming.ToString()
                : Guid.NewGuid().ToString("N");

            context.Response.Headers[CorrelationHeader] = correlationId;

            context.Response.OnStarting(() =>
            {
                context.Response.Headers["X-Response-Time-Ms"] = stopwatch.ElapsedMilliseconds.ToString();
                return Task.CompletedTask;
            });

            var traceId = Activity.Current?.TraceId.ToString() ?? context.TraceIdentifier;

            using var scope = _logger.BeginScope(new Dictionary<string, object>
            {
                ["service"] = "requests",
                ["correlationId"] = correlationId,
                ["traceId"] = traceId
            });

            try
            {
                await _next(context);
            }
            finally
            {
                stopwatch.Stop();

                _logger.LogInformation(
                    "HTTP {Method} {Path} -> {StatusCode} in {DurationMs}ms",
                    context.Request.Method,
                    context.Request.Path.Value,
                    context.Response.StatusCode,
                    stopwatch.ElapsedMilliseconds);
            }
        }
}