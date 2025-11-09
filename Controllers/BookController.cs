using Microsoft.AspNetCore.Mvc;
using Bookly.Models;

namespace Bookly.Controllers
{
    public class BookController : Controller
    {
        public IActionResult Index()
        {
            if (BD.UsuarioLogueado == null)
            {
                return RedirectToAction("Login", "Usuarios");
            }

            ViewBag.UsuarioNombre = BD.UsuarioLogueado.nombreComp;
            var libros = BD.ObtenerLibros();
            return View(libros);
        }

        public IActionResult Publicar()
        {
            if (BD.UsuarioLogueado == null)
            {
                return RedirectToAction("Login", "Usuarios");
            }
            return View();
        }

        [HttpPost]
        public IActionResult Publicar(Libros libro, decimal precio, string estadoLibro, string descripcion)
        {
            Usuarios usuario = BD.UsuarioLogueado;

            if (usuario == null)
            {
                return RedirectToAction("Login", "Usuarios");
            }

            BD.PublicarLibro(libro, usuario.DNI, precio, estadoLibro, descripcion);
            return RedirectToAction("Profile", "Home");
        }

        [HttpGet]
        public IActionResult Detalle(int id)
        {
            PublicacionesCompletas libro = BD.ObtenerPublicacionCompletaPorId(id);
            if (libro == null)
            {
                return RedirectToAction("Index", "Home");
            }
            return View(libro);
        }

        [HttpPost]
        public IActionResult Eliminar(int id)
        {
            BD.EliminarLibro(id);
            return RedirectToAction("Profile", "Home");
        }

        [HttpGet]
        public IActionResult Edit(int id)
        {
            Libros libro = BD.ObtenerLibroPorId(id);
            if (libro == null)
            {
                ViewBag.Error = "El libro no existe o fue eliminado.";
                return RedirectToAction("Index", "Home");
            }

            return View(libro);
        }

        [HttpPost]
        public IActionResult Edit(Libros libro, decimal precio, string estadoLibro, string descripcion)
        {
            BD.EditarLibro(libro);
            BD.EditarPublicacion(libro.id, precio, estadoLibro, descripcion);
            return RedirectToAction("Profile", "Home");
        }
    }
}
