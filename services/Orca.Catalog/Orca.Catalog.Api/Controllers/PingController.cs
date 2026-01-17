using System.Reflection.Metadata;
using Microsoft.AspNetCore.Mvc;

namespace Orca.Catalog.Api.Controllers;

[ApiController]
[Route("ping")]
public class PingController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(new { app = "ORCA Catalog Api", kind = "controller", ts = DateTime.UtcNow});
}