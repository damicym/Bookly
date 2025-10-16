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
    public IActionResult Profile()
    {
        if (BD.UsuarioLogueado == null)
        {
            return RedirectToAction("Login", "Usuarios");
        }
        ViewBag.UsuarioNombre = BD.UsuarioLogueado.nombreComp;
        return View(BD.UsuarioLogueado);
    }
    public ActionResult Mensajes()
    {
        return View();
    }
}

