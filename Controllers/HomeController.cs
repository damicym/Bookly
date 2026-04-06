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
            ViewBag.userLogged = user != null;
            ViewBag.usuario = user;
            return View(publicaciones);
        }

        public IActionResult Profile()
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null)
            {
                return RedirectToAction("Login", "Usuarios");
            }
            ViewBag.usuario = user;

            var publicaciones = BD.ObtenerPublicacionesCompletasPorUsuario(user.DNI);
            return View(publicaciones);
        }
        public IActionResult Mensajes()
        {
            return View();
        }
        
        public IActionResult Buscar(string query, string materia, string ano, string estado, string precioMin, string precioMax/* , string orden, string direccion */)
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            List<PublicacionesCompletas> resultados;
            try
            {
                if (user == null){
                resultados = BD.ObtenerLibrosMostrablesConTope()
                    .Where(l => 
                        l.nombre != null && 
                        (!string.IsNullOrWhiteSpace(query) && RemoveTildes(l.nombre).ToLower().Contains(RemoveTildes(query).ToLower())) &&
                        (!string.IsNullOrWhiteSpace(materia) && RemoveTildes(l.materia).ToLower().Equals(RemoveTildes(materia).ToLower())) &&
                        (!string.IsNullOrWhiteSpace(ano) && l.ano.ToString().Equals(ano)) &&
                        (!string.IsNullOrWhiteSpace(estado) && RemoveTildes(l.estadoLibro).ToLower().Equals((RemoveTildes(estado)).ToLower())) &&
                        (!string.IsNullOrWhiteSpace(precioMin) && l.precio >= double.Parse(precioMin)) &&
                        (!string.IsNullOrWhiteSpace(precioMax) && l.precio <= double.Parse(precioMax))
                    )
                    .ToList();
                    // order
                } else{
                    resultados = BD.ObtenerLibrosMostrablesConTope()
                        .Where(l => l.nombre != null && RemoveTildes(l.nombre).ToLower().Contains(RemoveTildes(query).ToLower()) && l.idVendedor != user.DNI)
                        .ToList();
                        // order
                }
            } catch (System.Exception ex) {
                _logger.LogError(ex, "Error al procesar los filtros de búsqueda");
                resultados = new List<PublicacionesCompletas>();
            }

            return Json(new { publicaciones = resultados });
        }

        // public static string ObtenerMaterias()
        // {
            // var materias = BD.ObtenerMaterias();
            // return JsonSerializerHelper.Serialize(materias);
        // }

        public static string RemoveTildes(string input)
        {
            if (string.IsNullOrWhiteSpace(input))
                return string.Empty;
            
            string normalizedString = input.Normalize(System.Text.NormalizationForm.FormD);
            var stringBuilder = new System.Text.StringBuilder();
            
            foreach (var c in normalizedString)
            {
                var unicodeCategory = System.Globalization.CharUnicodeInfo.GetUnicodeCategory(c);
                if (unicodeCategory != System.Globalization.UnicodeCategory.NonSpacingMark)
                {
                    stringBuilder.Append(c);
                }
            }
            
            return stringBuilder.ToString();
        }
    }
}
