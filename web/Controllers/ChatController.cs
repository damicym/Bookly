using Microsoft.AspNetCore.Mvc;
using Bookly.Models;

namespace Bookly.Controllers
{
    public class ChatController : Controller
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
    }
}
