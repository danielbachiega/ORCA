using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc.Testing;
using Orca.Catalog.Api;
using Orca.Catalog.Domain.Entities;
using Xunit;

namespace Orca.Catalog.Api.IntegrationTests;

public class FormDefinitionsControllerTests : IClassFixture<WebApplicationFactory<Program>>
{
    private readonly HttpClient _client;
    private readonly WebApplicationFactory<Program> _factory;

    public FormDefinitionsControllerTests(WebApplicationFactory<Program> factory)
    {
        _factory = factory;
        _client = factory.CreateClient();
    }

    [Fact]
    public async Task GetAll_ReturnsOkWithEmptyList()
    {
        // Act
        var response = await _client.GetAsync("/api/form-definitions");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsAsync<List<FormDefinition>>();
        Assert.NotNull(content);
    }

    [Fact]
    public async Task GetById_WithInvalidId_ReturnsNotFound()
    {
        // Arrange
        var invalidId = Guid.NewGuid();

        // Act
        var response = await _client.GetAsync($"/api/form-definitions/{invalidId}");

        // Assert
        Assert.Equal(HttpStatusCode.NotFound, response.StatusCode);
    }

    [Fact]
    public async Task Create_WithValidFormDefinition_ReturnsCreatedAtAction()
    {
        // Arrange
        var offerId = Guid.NewGuid();
        var formDef = new FormDefinition
        {
            Id = Guid.NewGuid(),
            OfferId = offerId,
            Version = 1,
            JsonSchema = "{\"type\": \"object\"}",
            UiSchema = "{\"type\": \"form\"}",
            Rules = "{\"rules\": []}"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/form-definitions", formDef);

        // Assert
        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var returnedDef = await response.Content.ReadAsAsync<FormDefinition>();
        Assert.NotNull(returnedDef);
        Assert.Equal(formDef.Id, returnedDef.Id);
    }

    [Fact]
    public async Task Create_WithMissingJsonSchema_ReturnsBadRequest()
    {
        // Arrange
        var formDef = new FormDefinition
        {
            Id = Guid.NewGuid(),
            OfferId = Guid.NewGuid(),
            Version = 1,
            JsonSchema = null!, // Obrigatório
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/form-definitions", formDef);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_WithInvalidJsonSchema_ReturnsBadRequest()
    {
        // Arrange
        var formDef = new FormDefinition
        {
            Id = Guid.NewGuid(),
            OfferId = Guid.NewGuid(),
            Version = 1,
            JsonSchema = "invalid json {" // JSON inválido
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/form-definitions", formDef);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task Create_WithVersionZero_ReturnsBadRequest()
    {
        // Arrange
        var formDef = new FormDefinition
        {
            Id = Guid.NewGuid(),
            OfferId = Guid.NewGuid(),
            Version = 0, // Deve ser > 0
            JsonSchema = "{\"type\": \"object\"}"
        };

        // Act
        var response = await _client.PostAsJsonAsync("/api/form-definitions", formDef);

        // Assert
        Assert.Equal(HttpStatusCode.BadRequest, response.StatusCode);
    }

    [Fact]
    public async Task GetByOfferId_ReturnsOkWithFilteredResults()
    {
        // Arrange
        var offerId = Guid.NewGuid();

        // Act
        var response = await _client.GetAsync($"/api/form-definitions/offer/{offerId}");

        // Assert
        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        var content = await response.Content.ReadAsAsync<List<FormDefinition>>();
        Assert.NotNull(content);
    }
}
