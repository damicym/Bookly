using Microsoft.AspNetCore.Mvc;
using Bookly.Models;

namespace Bookly.Controllers
{
    public class BookController : Controller
    {

        public IActionResult Index()
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null)
            {
                return RedirectToAction("Login", "Usuarios");
            }

            ViewBag.UsuarioNombre = user.nombreComp;
            var libros = BD.ObtenerLibros();
            return View(libros);
        }

        public IActionResult Publicar()
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null)
            {
                return RedirectToAction("Login", "Usuarios", new { returnView = "Publicar" });
            }
            ViewBag.usuario = user;
            return View();
        }

        [HttpPost]
        public IActionResult Publicar(Libros libro, decimal precio, string estadoLibro, string descripcion,  IFormFile imagen)
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null)
                return RedirectToAction("Login", "Usuario");

            byte[] imagenBytes = null;
            
            if (imagen != null && imagen.Length > 0)
            {
                using (var ms = new MemoryStream())
                {
                    imagen.CopyTo(ms);
                    imagenBytes = ms.ToArray();
                }
            }

            BD.PublicarLibro(libro, user.DNI, precio, estadoLibro, descripcion, imagenBytes);

            return RedirectToAction("Index", "Home");
        }

        [HttpGet]
        public IActionResult Detalle(int id, string idVendedor)
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            PublicacionesCompletas libro = BD.ObtenerPublicacionCompletaPorId(id);
            Usuarios vendedor = BD.ObtenerUsuarioPorDNI(idVendedor);
            if (libro == null)
            {
                return RedirectToAction("Index", "Home");
            }

            // Marcar si está deseado por el usuario actual
            if (user != null)
            {
                var favoritos = BD.ObtenerDeseadosPorUsuario(user.DNI).ToHashSet();
                libro.esDeseado = favoritos.Contains(libro.id);
            }

            // Marcar si es el más barato entre publicaciones del mismo libro
            var todasPublicaciones = BD.ObtenerLibrosMostrablesConTope();
            var mismoLibro = todasPublicaciones
                .Where(p => p.nombre != null && libro.nombre != null &&
                            p.nombre.Trim().ToLowerInvariant() == libro.nombre.Trim().ToLowerInvariant())
                .ToList();
            if (mismoLibro.Count > 1)
            {
                double minPrecio = mismoLibro.Min(p => p.precio);
                libro.esMasBarato = libro.precio == minPrecio;
            }

            ViewBag.Publicaciones = BD.ObtenerPublicacionesCompletasPorUsuario(idVendedor);
            ViewBag.Vendedor = vendedor;
            ViewBag.usuario = user;
            return View(libro);
        }

        [HttpPost]
        public IActionResult Eliminar(int id)
        {
            BD.EliminarPublicacion(id);
            return RedirectToAction("Profile", "Home");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult Desear(int id, bool esDeseado)
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null)
            {
                return Json(new { success = false, message = "Usuario no autenticado" });
            }

            try
            {
                if (!esDeseado)
                {
                    BD.AgregarDeseado(user.DNI, id);
                }
                else
                {
                    BD.EliminarDeseado(user.DNI, id);
                }
                return Json(new { success = true });
            }
            catch (Exception ex)
            {
                return Json(new { success = false, message = ex.Message });
            }
        }

        [HttpGet]
        public IActionResult Editar(int id)
        {
            // Obtener la publicación completa por su ID
            PublicacionesCompletas publicacion = BD.ObtenerPublicacionCompletaPorId(id);

            if (publicacion == null)
            {
                ViewBag.Error = "La publicación no existe o fue eliminada.";
                return RedirectToAction("Index", "Home");
            }

            // Enviar la publicación a la vista para editar
            return View(publicacion);
        }

        // Endpoint para autocomplete de nombres de libros
        [HttpGet]
        public IActionResult AutocompleteNombres(string q)
        {
            try
            {
                var resultados = BD.BuscarNombresLibros(q ?? string.Empty);
                return Json(resultados);
            }
            catch (Exception ex)
            {
                return Json(new List<string>());
            }
        }

        // Devuelve los datos de un libro por nombre (para autocompletar campos)
        [HttpGet]
        public IActionResult ObtenerLibroPorNombre(string nombre)
        {
            try
            {
                var libro = BD.ObtenerLibroPorNombre(nombre ?? string.Empty);
                if (libro == null)
                    return Json(new { found = false });

                return Json(new {
                    found = true,
                    id = libro.id,
                    nombre = libro.nombre,
                    materia = libro.materia,
                    ano = libro.ano,
                    editorial = libro.editorial
                });
            }
            catch
            {
                return Json(new { found = false });
            }
        }

        [HttpPost]
        public IActionResult Editar(int id, string nombre, string materia, string ano, string editorial, decimal precio, string estadoLibro, string descripcion, IFormFile imagen, string imagenEliminada)
        {
            PublicacionesCompletas publicacion = BD.ObtenerPublicacionCompletaPorId(id);
            if (publicacion == null)
                return NotFound();

            byte[] imagenBytes = publicacion.imagen;

            // Si el usuario marcó la imagen para eliminar
            if (imagenEliminada == "true")
            {
                imagenBytes = null;  // Establece la imagen como null para usar la predeterminada
            }
            // Si se subió una nueva imagen
            else if (imagen != null && imagen.Length > 0)
            {
                using (var ms = new MemoryStream())
                {
                    imagen.CopyTo(ms);
                    imagenBytes = ms.ToArray();
                }
            }
            // Si no se hizo nada, mantiene la imagen actual

            // Actualizar en base de datos
            BD.EditarPublicacionCompleta(id, nombre, materia, ano, editorial, precio, estadoLibro, descripcion, imagenBytes);

            return RedirectToAction("Profile", "Home");
        }
    }
}