#nullable enable

using Microsoft.EntityFrameworkCore;
using Orca.Forms.Domain.Entities;
using Orca.Forms.Domain.Repositories;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace Orca.Forms.Infrastructure.Repositories
{
    public class FormDefinitionRepository : IFormDefinitionRepository
    {
        private readonly FormsContext _context;

        public FormDefinitionRepository(FormsContext context)
        {
            _context = context ?? throw new ArgumentNullException(nameof(context));
        }

        public async Task<IEnumerable<FormDefinition>> GetAllAsync()
        {
            return await _context.FormDefinitions.AsNoTracking().OrderByDescending(fd => fd.CreatedAtUtc).ToListAsync();
        }

        public async Task<FormDefinition?> GetByIdAsync(Guid id)
        {
            return await _context.FormDefinitions.AsNoTracking().FirstOrDefaultAsync(fd => fd.Id == id);
        }

        public async Task<IEnumerable<FormDefinition>> GetByOfferIdAsync(Guid offerId)
        {
            return await _context.FormDefinitions
                .AsNoTracking()
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

            var existing = await _context.FormDefinitions.AsNoTracking().FirstOrDefaultAsync(fd => fd.Id == formDefinition.Id);
            if (existing == null)
                throw new InvalidOperationException($"FormDefinition com ID {formDefinition.Id} não encontrado");

            _context.ChangeTracker.Clear();
            _context.FormDefinitions.Update(formDefinition);
            await _context.SaveChangesAsync();
            return formDefinition;
        }

        public async Task PublishAsync(Guid formDefinitionId)
        {
            var formToPublish = await GetByIdAsync(formDefinitionId);
            if (formToPublish == null)
                throw new InvalidOperationException($"FormDefinition com ID {formDefinitionId} não encontrado");

            // Desativar versão publicada anterior da mesma oferta (se houver)
            var previousPublished = await _context.FormDefinitions
                .FirstOrDefaultAsync(fd => fd.OfferId == formToPublish.OfferId && fd.IsPublished && fd.Id != formDefinitionId);

            if (previousPublished != null)
            {
                previousPublished.IsPublished = false;
                _context.FormDefinitions.Update(previousPublished);
            }

            formToPublish.IsPublished = true;
            _context.FormDefinitions.Update(formToPublish);
            await _context.SaveChangesAsync();
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
