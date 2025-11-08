using System.Collections.Generic;
using System.Linq;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Bookly.Models;
using Microsoft.AspNetCore.Mvc.ViewFeatures;
using Bookly.Helpers;

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
            List<PublicacionesCompletas> publicaciones;

            if (BD.UsuarioLogueado != null)
            {
                int anoUsuario = BD.UsuarioLogueado.ano;
                publicaciones = BD.ObtenerRecomendacionesPorAno(anoUsuario);

                ViewBag.Titulo = $"Recomendaciones para {HtmlHelpers.PasarAñoATexto(anoUsuario)} año";
            }
            else
            {
                publicaciones = BD.ObtenerLibrosMostrablesConTope(10);
                ViewBag.Titulo = "Últimas publicaciones";
            }

            return View(publicaciones);
        }


        public IActionResult Profile()
        {
            Usuarios usuario = BD.UsuarioLogueado;
            if (usuario == null)
                return RedirectToAction("Login", "Usuarios");
            ViewBag.usuario = usuario;
            List<PublicacionesCompletas> publicaciones = BD.ObtenerPublicacionesCompletasPorUsuario(usuario.DNI);
            return View(publicaciones);
        }

        public IActionResult Mensajes()
        {
            return View();
        }

        [HttpGet]
        public IActionResult Buscar(string query)
        {
            List<PublicacionesCompletas> resultados;
            if (!string.IsNullOrWhiteSpace(query))
            {
                resultados = BD.ObtenerLibrosMostrablesConTope()
                    .Where(l => l.nombre != null && l.nombre.ToLower().Contains(query.ToLower()))
                    .ToList();
            }
            else
            {
                resultados = BD.ObtenerLibrosMostrablesConTope();
            }
            ViewData["Title"] = "Resultados de búsqueda";
            return View(resultados);
        }
    }
}
