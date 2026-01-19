#nullable enable

using Microsoft.EntityFrameworkCore;
using Orca.Catalog.Domain.Entities;
using Orca.Catalog.Domain.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Orca.Catalog.Infrastructure.Repositories
{
    public class FormDefinitionRepository : IFormDefinitionRepository
    {
        private readonly CatalogContext _context;

        public FormDefinitionRepository(CatalogContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        public async Task<IEnumerable<FormDefinition>> GetAllAsync()
        {
            return await _context.FormDefinitions.OrderByDescending(fd => fd.CreatedAtUtc).ToListAsync();
        }

        public async Task<FormDefinition?> GetByIdAsync(Guid id)
        {
            return await _context.FormDefinitions.FirstOrDefaultAsync(fd => fd.Id == id);
        }

        public async Task<IEnumerable<FormDefinition>> GetByOfferIdAsync(Guid offerId)
        {
            return await _context.FormDefinitions
                .Where(fd => fd.OfferId == offerId)
                .OrderByDescending(fd => fd.Version)
                .ToListAsync();
        }

        public async Task<FormDefinition> CreateAsync(FormDefinition formDefinition)
        {
            if (formDefinition == null)
                throw new ArgumentNullException(nameof(formDefinition));

            _context.FormDefinitions.Add(formDefinition);
            await _context.SaveChangesAsync();
            return formDefinition;
        }

        public async Task<FormDefinition> UpdateAsync(FormDefinition formDefinition)
        {
            if (formDefinition == null)
                throw new ArgumentNullException(nameof(formDefinition));

            var existing = await GetByIdAsync(formDefinition.Id);
            if (existing == null)
                throw new InvalidOperationException($"FormDefinition com ID {formDefinition.Id} não encontrado");

            _context.FormDefinitions.Update(formDefinition);
            await _context.SaveChangesAsync();
            return formDefinition;
        }

        public async Task DeleteAsync(Guid id)
        {
            var formDefinition = await GetByIdAsync(id);
            if (formDefinition == null)
                throw new InvalidOperationException($"FormDefinition com ID {id} não encontrado");

            _context.FormDefinitions.Remove(formDefinition);
            await _context.SaveChangesAsync();
        }
    }
}