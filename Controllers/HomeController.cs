using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
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
            Usuarios usuario = BD.UsuarioLogueado;
            if (usuario == null)
                return RedirectToAction("Login", "Usuarios");
            ViewBag.usuario = usuario;
            List<Publicacion> publicaciones = BD.ObtenerPublicacionesPorUsuario(usuario.DNI);
            return View(publicaciones);
        }

        public IActionResult Mensajes()
        {
            return View();
        }

        [HttpGet]
        public IActionResult Buscar(string query)
        {
            List<Libros> resultados;
            if (!string.IsNullOrWhiteSpace(query))
            {
                resultados = BD.ObtenerLibros()
                               .Where(l => l.nombre != null && l.nombre.ToLower().Contains(query.ToLower()))
                               .ToList();
            }
            else
            {
                resultados = BD.ObtenerLibros();
            }
            ViewData["Title"] = "Resultados de búsqueda";
            return View(resultados); // Mapea a Views/Home/Buscar.cshtml
        }
    }
}