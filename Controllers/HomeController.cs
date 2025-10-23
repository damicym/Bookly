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
        var librosUsuario = BD.ObtenerLibrosPorUsuario(BD.UsuarioLogueado.DNI);

        if (librosUsuario == null || librosUsuario.Count == 0)
        {
            ViewBag.Mensaje = "No publicaste ningún libro todavía.";
        }

        return View(librosUsuario);
    }
    public ActionResult Mensajes()
    {
        return View();
    }
}

