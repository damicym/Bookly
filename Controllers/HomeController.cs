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
            List<PublicacionesCompletas> publicaciones;

            if (BD.UsuarioLogueado != null)
            {
                int anoUsuario = BD.UsuarioLogueado.ano;
                publicaciones = BD.ObtenerRecomendacionesPorAno(anoUsuario);

                string textoAno = "";
                switch (anoUsuario)
                {
                    case 1: textoAno = "7mo grado"; break;
                    case 2: textoAno = "1er año"; break;
                    case 3: textoAno = "2do año"; break;
                    case 4: textoAno = "3er año"; break;
                    case 5: textoAno = "4to año"; break;
                    case 6: textoAno = "5to año"; break;
                }

                ViewBag.Titulo = $"Recomendaciones para {textoAno}";
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
