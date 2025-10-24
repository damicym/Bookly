using System.Diagnostics;
using Microsoft.AspNetCore.Mvc;
using Bookly.Models;

namespace Bookly.Controllers
{
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
            Usuarios usuario = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (usuario == null)
            {
                return RedirectToAction("Login", "Usuarios");
            }

            ViewBag.usuario = usuario;
      

            List<Publicacion> publicaciones = BD.ObtenerPublicacionesPorUsuario(usuario.DNI);
            return View(publicaciones);
        }

        public IActionResult Mensajes()
        {
            return View();
        }
    }
}
