using System.Collections.Generic;
using System.Linq;
using System.Globalization;
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
            MarcarMasBaratos(publicaciones);
            publicaciones = publicaciones
                .OrderByDescending(p => p.esMasBarato)
                .ThenBy(p => p.precio)
                .ToList();
            ViewBag.userLogged = user != null;
            ViewBag.usuario = user;
            return View(publicaciones);
        }

        public IActionResult Catalogo(string query)
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            var libros = BD.ObtenerLibros() ?? new List<Libros>();
            ViewBag.materias = libros.Select(l => l.materia).Distinct().ToList();
            ViewBag.anos = libros.Select(l => l.ano).Distinct().ToList();
            ViewBag.editoriales = libros.Select(l => l.editorial).Distinct().ToList();
            ViewBag.query = query;
            // Proveer al layout la info de usuario para mostrar el nombre cuando esté logueado. (esto arregla lo de que no se muestre el nombre de usuario si se está en catalogo)
            ViewBag.userLogged = user != null;
            ViewBag.usuario = user;
            return View("Buscar");
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
        
        public IActionResult Buscar(string query, string materia, string ano, string estado, string editorial, string precioMin, string precioMax/* , string orden, string direccion */)
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            List<PublicacionesCompletas> resultados;
            try
            {
                var precioMinValue = ParseNullableDouble(precioMin);
                var precioMaxValue = ParseNullableDouble(precioMax);
                var queryNormalizada = RemoveTildes(query).ToLower();
                var materiaNormalizada = RemoveTildes(materia).ToLower();
                var estadoNormalizado = RemoveTildes(NormalizarEstado(estado)).ToLower();
                var editorialNormalizada = RemoveTildes(editorial).ToLower();

                var consulta = BD.ObtenerLibrosMostrablesConTope()
                    .Where(l => l.nombre != null)
                    .Where(l => string.IsNullOrWhiteSpace(query) || RemoveTildes(l.nombre).ToLower().Contains(queryNormalizada))
                    .Where(l => string.IsNullOrWhiteSpace(materia) || RemoveTildes(l.materia).ToLower().Equals(materiaNormalizada))
                    .Where(l => string.IsNullOrWhiteSpace(ano) || l.ano.ToString().Equals(ano))
                    .Where(l => string.IsNullOrWhiteSpace(estado) || RemoveTildes(l.estadoLibro).ToLower().Equals(estadoNormalizado))
                    .Where(l => string.IsNullOrWhiteSpace(editorial) || RemoveTildes(l.editorial).ToLower().Equals(editorialNormalizada))
                    .Where(l => !precioMinValue.HasValue || l.precio >= precioMinValue.Value)
                    .Where(l => !precioMaxValue.HasValue || l.precio <= precioMaxValue.Value);

                if (user != null)
                {
                    consulta = consulta.Where(l => l.idVendedor != user.DNI);
                }

                resultados = consulta.ToList();
                MarcarMasBaratos(resultados);
                // Los más baratos de su grupo van primero
                resultados = resultados
                    .OrderByDescending(p => p.esMasBarato)
                    .ThenBy(p => p.precio)
                    .ToList();
            } catch (System.Exception ex) {
                _logger.LogError(ex, "Error al procesar los filtros de búsqueda");
                resultados = new List<PublicacionesCompletas>();
            }

            return Json(new { publicaciones = resultados });
        }

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

        private static double? ParseNullableDouble(string valor)
        {
            if (string.IsNullOrWhiteSpace(valor))
            {
                return null;
            }

            if (double.TryParse(valor, NumberStyles.Any, CultureInfo.CurrentCulture, out var numero))
            {
                return numero;
            }

            if (double.TryParse(valor, NumberStyles.Any, CultureInfo.InvariantCulture, out numero))
            {
                return numero;
            }

            return null;
        }

        private static string NormalizarEstado(string estado)
        {
            if (string.IsNullOrWhiteSpace(estado))
            {
                return string.Empty;
            }

            return estado.ToLower() switch
            {
                "a" => "Como nuevo",
                "b" => "Pocas anotaciones",
                "c" => "Con algunas anotaciones",
                "d" => "Muy anotado",
                _ => estado
            };
        }

        private static void MarcarMasBaratos(List<PublicacionesCompletas> publicaciones)
        {
            // Agrupar por nombre de libro (case-insensitive) y marcar el/los más baratos
            var minimosPorNombre = publicaciones
                .Where(p => p.nombre != null)
                .GroupBy(p => p.nombre.Trim().ToLowerInvariant())
                .ToDictionary(g => g.Key, g => g.Min(p => p.precio));

            foreach (var pub in publicaciones)
            {
                if (pub.nombre == null) continue;
                var key = pub.nombre.Trim().ToLowerInvariant();
                // Solo mostrar el tag si hay más de una publicación con ese nombre
                var count = publicaciones.Count(p => p.nombre != null && p.nombre.Trim().ToLowerInvariant() == key);
                pub.esMasBarato = count > 1 && pub.precio == minimosPorNombre[key];
            }
        }
    }

    
}
