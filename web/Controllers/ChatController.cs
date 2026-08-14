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
                ViewBag.VendedorVentasCerradas = vendedor?.ventasCerradas ?? 0;

                // Publicaciones activas del vendedor (para la grilla en el widget)
                var pubsVendedor = BD.ObtenerPublicacionesCompletasPorUsuario(vendedor.DNI);
                ViewBag.VendedorPublicaciones = pubsVendedor.Where(p => p.status == 1).ToList();
                ViewBag.VendedorPublicacionesActivas = pubsVendedor.Count(p => p.status == 1);

                // Reseñas del vendedor — promedios de atención y entrega
                var resenasVendedor = BD.ObtenerResenasPorReceptor(vendedor.DNI);
                var resenasCompletadas = resenasVendedor
                    .Where(r => r.atencion.HasValue && r.entrega.HasValue)
                    .ToList();
                ViewBag.VendedorResenaCount = resenasCompletadas.Count;
                ViewBag.VendedorPromedioAtencion = resenasCompletadas.Count > 0
                    ? resenasCompletadas.Average(r => (double)r.atencion.Value)
                    : (double?)null;
                ViewBag.VendedorPromedioEntrega = resenasCompletadas.Count > 0
                    ? resenasCompletadas.Average(r => (double)r.entrega.Value)
                    : (double?)null;
            }
            else
            {
                ViewBag.VendedorVentasCerradas = 0;
                ViewBag.VendedorPublicaciones = new List<PublicacionesCompletas>();
                ViewBag.VendedorPublicacionesActivas = 0;
                ViewBag.VendedorResenaCount = 0;
                ViewBag.VendedorPromedioAtencion = (double?)null;
                ViewBag.VendedorPromedioEntrega = (double?)null;
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
