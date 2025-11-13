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
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user != null)
            {
                int anoUsuario = user.ano;
                publicaciones = BD.ObtenerRecomendacionesPorAno(anoUsuario)
                    .Where(p => p.idVendedor != user.DNI).ToList();

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
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null)
                return RedirectToAction("Login", "Usuarios");
            ViewBag.usuario = user;
            List<PublicacionesCompletas> publicaciones = BD.ObtenerPublicacionesCompletasPorUsuario(user.DNI);
            return View(publicaciones);
        }

        public IActionResult Mensajes()
        {
            return View();
        }

        [HttpGet]
        public IActionResult Buscar(string query)
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            List<PublicacionesCompletas> resultados;
            if (!string.IsNullOrWhiteSpace(query))
            {
                if (user == null){
                resultados = BD.ObtenerLibrosMostrablesConTope()
                    .Where(l => l.nombre != null && l.nombre.ToLower().Contains(query.ToLower()))
                    .ToList();
                } else{
                   resultados = BD.ObtenerLibrosMostrablesConTope()
                        .Where(l => l.nombre != null && l.nombre.ToLower().Contains(query.ToLower()) && l.idVendedor != user.DNI)
                        .ToList(); 
                }
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
