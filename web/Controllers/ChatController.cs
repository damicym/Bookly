using Microsoft.AspNetCore.Mvc;
using Bookly.Models;

namespace Bookly.Controllers
{
    public class ChatController : BaseController
    {
        public IActionResult Chat(string? vendedorDNI, int? idPublicacion)
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null)
            {
                return RedirectToAction("Login", "Usuarios");
            }

            ViewBag.usuario = user;

            // Cargar datos reales del vendedor si se recibe un DNI
            Usuarios vendedor = null;
            if (!string.IsNullOrWhiteSpace(vendedorDNI))
            {
                vendedor = BD.ObtenerUsuarioPorDNI(vendedorDNI);
            }

            // Fallback mientras no hay un vendedor específico
            if (vendedor == null)
            {
                vendedor = new Usuarios
                {
                    DNI          = "",
                    nombreComp   = "",
                    ano          = null,
                    especialidad = "",
                    curso        = "",
                    aboutMe      = "",
                    fotoPerfil   = null
                };
            }

            ViewBag.Vendedor = vendedor;

            // Estadísticas del vendedor
            if (!string.IsNullOrWhiteSpace(vendedor.DNI))
            {
                var pubsVendedor = BD.ObtenerPublicacionesCompletasPorUsuario(vendedor.DNI);
                ViewBag.VendedorVentasCerradas = pubsVendedor.Count(p => p.status == 0);
            }
            else
            {
                ViewBag.VendedorVentasCerradas = 0;
            }

            // Si viene desde "Consultar publicación", pasar los datos de la publi
            if (idPublicacion.HasValue)
            {
                var publi = BD.ObtenerPublicacionCompletaPorId(idPublicacion.Value);
                ViewBag.PublicacionConsulta = publi;
            }

            return View();
        }

        /// <summary>
        /// GET /Chat/BuscarUsuarios?q=texto
        /// Devuelve JSON con lista de usuarios que coinciden con el query.
        /// Excluye al usuario logueado de los resultados.
        /// </summary>
        [HttpGet]
        public IActionResult BuscarUsuarios(string q)
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null) return Unauthorized();

            if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 2)
                return Json(new List<object>());

            var resultados = BD.BuscarUsuarios(q)
                .Where(u => u.DNI != user.DNI)
                .Select(u => new
                {
                    dni        = u.DNI,
                    nombre     = u.nombreComp,
                    especialidad = u.especialidad,
                    curso      = u.curso,
                    ano        = u.ano,
                    fotoPerfil = u.fotoPerfil
                })
                .ToList();

            return Json(resultados);
        }
    }
}
