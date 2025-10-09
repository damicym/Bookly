using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Bookly.Models;
namespace Bookly.Controllers;

public class HomeController : Controller
{
    private readonly ILogger<HomeController> _logger;

    public HomeController(ILogger<HomeController> logger)
    {
        _logger = logger;
    }

    public IActionResult Index()
    {
        return View();
    }
    public ActionResult Perfil()
    {
        return View();
    }
    public ActionResult Mensajes()
    {
        return View();
    }
}

