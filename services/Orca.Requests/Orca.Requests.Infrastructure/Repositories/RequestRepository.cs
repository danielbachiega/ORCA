#nullable enable

using Microsoft.EntityFrameworkCore;
using Orca.Requests.Domain.Entities;
using Orca.Requests.Domain.Repositories;

namespace Orca.Requests.Infrastructure.Repositories;

public class RequestRepository : IRequestRepository
{
    private readonly RequestsContext _context;

    public RequestRepository(RequestsContext context)
    {
        _context = context ?? throw new ArgumentNullException(nameof(context));
    }

    public async Task<IEnumerable<Request>> GetAllAsync()
    {
        return await _context.Requests
            .AsNoTracking()
            .OrderByDescending(r => r.CreatedAtUtc)
            .ToListAsync();
    }

    public async Task<IEnumerable<Request>> GetByUserAndOfferAsync(string userId, Guid offerId)
    {
        return await _context.Requests
            .AsNoTracking()
            .Where(r => r.UserId == userId && r.OfferId == offerId)
            .OrderByDescending(r => r.CreatedAtUtc)
            .ToListAsync();
    }

    public async Task<Request?> GetByIdAsync(Guid id)
    {
        return await _context.Requests
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == id);
    }

    public async Task<IEnumerable<Request>> GetByOfferIdAsync(Guid offerId)
    {
        return await _context.Requests
            .AsNoTracking()
            .Where(r => r.OfferId == offerId)
            .OrderByDescending(r => r.CreatedAtUtc)
            .ToListAsync();
    }

    public async Task<IEnumerable<Request>> GetByUserIdAsync(string userId)
    {
        return await _context.Requests
            .AsNoTracking()
            .Where(r => r.UserId == userId)
            .OrderByDescending(r => r.CreatedAtUtc)
            .ToListAsync();
    }

    public async Task<IEnumerable<Request>> GetByStatusAsync(RequestStatus status)
    {
        return await _context.Requests
            .AsNoTracking()
            .Where(r => r.Status == status)
            .OrderByDescending(r => r.CreatedAtUtc)
            .ToListAsync();
    }

    public async Task<Request> CreateAsync(Request request)
    {
        if (request == null)
            throw new ArgumentNullException(nameof(request));

        _context.Requests.Add(request);
        await _context.SaveChangesAsync();
        return request;
    }

    public async Task<Request> UpdateAsync(Request request)
    {
        if (request == null)
            throw new ArgumentNullException(nameof(request));

        var existing = await _context.Requests
            .AsNoTracking()
            .FirstOrDefaultAsync(r => r.Id == request.Id);

        if (existing == null)
            throw new InvalidOperationException($"Request com ID {request.Id} não encontrado");

        _context.ChangeTracker.Clear();
        _context.Requests.Update(request);
        await _context.SaveChangesAsync();
        return request;
    }

    public async Task DeleteAsync(Guid id)
    {
        var request = await GetByIdAsync(id);
        if (request == null)
            throw new InvalidOperationException($"Request com ID {id} não encontrado");

        _context.Requests.Remove(request);
        await _context.SaveChangesAsync();
    }
}