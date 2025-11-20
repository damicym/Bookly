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
                return RedirectToAction("Login", "Usuarios");
            }
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
            PublicacionesCompletas libro = BD.ObtenerPublicacionCompletaPorId(id);
            Usuarios vendedor = BD.ObtenerUsuarioPorDNI(idVendedor);
            if (libro == null)
            {
                return RedirectToAction("Index", "Home");
            }
            ViewBag.Publicaciones = BD.ObtenerPublicacionesCompletasPorUsuario(idVendedor);
            ViewBag.Vendedor = vendedor;
            return View(libro);
        }

        [HttpPost]
        public IActionResult Eliminar(int id)
        {
            BD.EliminarPublicacion(id);
            return RedirectToAction("Profile", "Home");
        }

        [HttpGet]
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

        [HttpPost]
        public IActionResult Editar(int id,string nombre, string materia, string ano, string editorial, decimal precio, string estadoLibro, string descripcion, IFormFile imagen)
        {
            PublicacionesCompletas publicacion = BD.ObtenerPublicacionCompletaPorId(id);
            if (publicacion == null)
                return NotFound();

            byte[] imagenBytes = publicacion.imagen;

            if (imagen != null && imagen.Length > 0)
            {
                using (var ms = new MemoryStream())
                {
                    imagen.CopyTo(ms);
                    imagenBytes = ms.ToArray();
                }
            }

            // Actualizar en base de datos
            BD.EditarPublicacionCompleta(id, nombre, materia, ano, editorial, precio, estadoLibro, descripcion, imagenBytes);

            return RedirectToAction("Profile", "Home");
        }
    }
}
