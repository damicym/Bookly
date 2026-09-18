using Microsoft.AspNetCore.Mvc;
using Bookly.Models;

namespace Bookly.Controllers
{
    public class BookController : BaseController
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

            BD.PublicarLibro(libro, user.DNI, precio, estadoLibro, descripcion, imagen);

            return RedirectToAction("Profile", "Home");
        }

        [HttpGet]
        public IActionResult Detalle(int id)
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null)
                return RedirectToAction("Login", "Usuarios", new { returnView = "Catalogo" });
            PublicacionesCompletas libro = BD.ObtenerPublicacionCompletaPorId(id);
            Usuarios vendedor = BD.ObtenerUsuarioPorDNI(libro.idVendedor);
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
            // (excluyendo las del usuario logueado, igual que en el catálogo)
            var todasPublicaciones = BD.ObtenerPublicacionesCompletasConTope();
            var mismoLibro = todasPublicaciones
                .Where(p => p.nombre != null && libro.nombre != null &&
                            p.nombre.Trim().ToLowerInvariant() == libro.nombre.Trim().ToLowerInvariant())
                .ToList();

            // Subconjunto visible para el usuario actual (sin sus propias publicaciones)
            var mismoLibroVisible = user != null
                ? mismoLibro.Where(p => p.idVendedor != user.DNI).ToList()
                : mismoLibro;

            if (mismoLibroVisible.Count > 1)
            {
                double minPrecio = mismoLibroVisible.Min(p => p.precio);
                libro.esMasBarato = libro.precio == minPrecio;
            }
            else
            {
                libro.esMasBarato = false;
            }

            ViewBag.Vendedor = vendedor;
            ViewBag.usuario = user;

            // Libros favoritos del vendedor — deduplicados por nombre de libro (para el modal de intercambio)
            var favoritasVendedor = BD.ObtenerPublicacionesFavoritasPorUsuario(libro.idVendedor);
            ViewBag.VendedorLibrosFavoritos = favoritasVendedor
                .GroupBy(f => f.nombre?.Trim().ToLowerInvariant() ?? "")
                .Select(g => g.First())
                .Take(6)
                .ToList();

            // Otras publicaciones del mismo libro, ordenadas por precio
            var otrasOpciones = mismoLibro
                .OrderBy(p => p.precio)
                .Where(p => p.id != id && p.status == 1 && p.idVendedor != user.DNI)
                .Take(5)
                .ToList();
            ViewBag.OtrasOpciones = otrasOpciones;

            return View(libro);
        }

        [HttpPost]
        public IActionResult Eliminar(int id)
        {
            BD.EliminarPublicacion(id);
            return RedirectToAction("Profile", "Home");
        }

        /// <summary>
        /// GET /Book/ObtenerInfoVendedor?dniVendedor=xxx
        /// Paso 1 del widget progresivo en Detalle: datos básicos del vendedor.
        /// </summary>
        [HttpGet]
        public IActionResult ObtenerInfoVendedor(string dniVendedor)
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null) return Unauthorized();

            if (string.IsNullOrWhiteSpace(dniVendedor)) return Json(null);

            var vendedor = BD.ObtenerUsuarioPorDNI(dniVendedor);
            if (vendedor == null) return Json(null);

            return Json(new
            {
                dni            = vendedor.DNI,
                nombreComp     = vendedor.nombreComp,
                ano            = vendedor.ano,
                anoTexto       = Helpers.HtmlHelpers.PasarAñoATextoCompleto(vendedor.ano),
                especialidad   = vendedor.especialidad,
                curso          = vendedor.curso,
                aboutMe        = vendedor.aboutMe,
                fotoPerfil     = vendedor.fotoPerfil,
                ventasCerradas = vendedor.ventasCerradas
            });
        }

        /// <summary>
        /// GET /Book/ObtenerResenasVendedor?dniVendedor=xxx
        /// Paso 2 del widget progresivo en Detalle: promedios de reseñas.
        /// </summary>
        [HttpGet]
        public IActionResult ObtenerResenasVendedor(string dniVendedor)
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null) return Unauthorized();

            if (string.IsNullOrWhiteSpace(dniVendedor))
                return Json(new { resenaCount = 0, promedioAtencion = (double?)null, promedioEntrega = (double?)null });

            var resenas = BD.ObtenerResenasPorReceptor(dniVendedor)
                            .Where(r => r.atencion.HasValue && r.entrega.HasValue).ToList();

            return Json(new
            {
                resenaCount      = resenas.Count,
                promedioAtencion = resenas.Count > 0 ? resenas.Average(r => (double)r.atencion.Value) : (double?)null,
                promedioEntrega  = resenas.Count > 0 ? resenas.Average(r => (double)r.entrega.Value)  : (double?)null,
            });
        }

        /// <summary>
        /// GET /Book/ObtenerPublicacionesVendedor?dniVendedor=xxx&excluirId=yyy
        /// Paso 3 del widget progresivo en Detalle: publicaciones activas del vendedor (máx 4,
        /// excluyendo la publicación que se está viendo).
        /// </summary>
        [HttpGet]
        public IActionResult ObtenerPublicacionesVendedor(string dniVendedor, int? excluirId)
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null) return Unauthorized();

            if (string.IsNullOrWhiteSpace(dniVendedor))
                return Json(new { activas = 0, publicaciones = new List<object>() });

            var pubs = BD.ObtenerPublicacionesCompletasPorUsuario(dniVendedor)
                         .Where(p => p.status == 1 && (!excluirId.HasValue || p.id != excluirId.Value))
                         .ToList();

            return Json(new
            {
                activas = BD.ObtenerPublicacionesCompletasPorUsuario(dniVendedor).Count(p => p.status == 1),
                publicaciones = pubs.Take(4).Select(p => new
                {
                    id     = p.id,
                    nombre = p.nombre,
                    precio = p.precio,
                    imagen = p.imagen
                }).ToList()
            });
        }

        // Endpoint de desarrollo: recarga las imágenes del seed desde wwwroot/img/libros/
        // Usar cuando se resetea la BD con el script SQL
        [HttpGet]
        public IActionResult RecargarImagenes()
        {
#if DEBUG
            var contentRoot = HttpContext.RequestServices
                .GetRequiredService<IWebHostEnvironment>().ContentRootPath;
            BD.ActualizarImagenes(contentRoot);
            return Content("✅ Imágenes recargadas correctamente.");
#else
            return NotFound();
#endif
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
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null)
                return RedirectToAction("Login", "Usuarios");

            // Obtener la publicación completa por su ID
            PublicacionesCompletas publicacion = BD.ObtenerPublicacionCompletaPorId(id);

            if (publicacion == null)
            {
                ViewBag.Error = "La publicación no existe o fue eliminada.";
                return RedirectToAction("Index", "Home");
            }

            ViewBag.usuario = user;
            // Enviar la publicación a la vista para editar
            return View(publicacion);
        }

        // Endpoint para autocomplete de nombres de libros
        [HttpGet]
        public IActionResult ObtenerTodosLosLibros()
        {
            try
            {
                var resultados = BD.ObtenerLibros();
                return Json(resultados);
            }
            catch (Exception ex)
            {
                return Json(new List<string>());
            }
        }

        // Devuelve los datos de una publicación por ID (para el modal de editar)
        [HttpGet]
        public IActionResult ObtenerPublicacion(int id)
        {
            var pub = BD.ObtenerPublicacionCompletaPorId(id);
            if (pub == null) return Json(new { found = false });
            return Json(new {
                found = true,
                id = pub.id,
                nombre = pub.nombre,
                materia = pub.materia,
                ano = pub.ano,
                editorial = pub.editorial,
                estadoLibro = pub.estadoLibro,
                precio = pub.precio,
                descripcion = pub.descripcion,
                tieneImagen = !string.IsNullOrWhiteSpace(pub.imagen),
                imagenSrc = !string.IsNullOrWhiteSpace(pub.imagen) ? pub.imagen : "/img/book-placeholder.webp"
            });
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

            IFormFile imagenFile = imagen;

            // Si el usuario marcó la imagen para eliminar
            if (imagenEliminada == "true")
            {
                imagenFile = null;
            }

            // Actualizar en base de datos
            BD.EditarPublicacionCompleta(id, nombre, materia, ano, editorial, precio, estadoLibro, descripcion, imagenFile, imagenEliminada == "true");

            return RedirectToAction("Profile", "Home");
        }
    }
}