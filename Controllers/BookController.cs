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
        public IActionResult Publicar(Libros libro)
        {
            if (BD.UsuarioLogueado == null)
            {
                return RedirectToAction("Login", "Usuarios");
            }

            if (string.IsNullOrWhiteSpace(libro.nombre) ||
                string.IsNullOrWhiteSpace(libro.materia) ||
                string.IsNullOrWhiteSpace(libro.ano) ||
                string.IsNullOrWhiteSpace(libro.editorial))
            {
                ViewBag.Error = "Todos los campos son obligatorios.";
                return View(libro);
            }

            BD.PublicarLibro(libro);
            return RedirectToAction("Index", "Home");
        }

        [HttpGet]
        public IActionResult Detalle(int id)
        {
            if (BD.UsuarioLogueado == null)
            {
                return RedirectToAction("Login", "Usuarios");
            }

            var libro = BD.ObtenerLibroPorId(id);
            if (libro == null)
            {
                return RedirectToAction("Index", "Home");
            }
            return View(libro);
        }

        [HttpPost]
        public IActionResult Eliminar(int id)
        {
            if (BD.UsuarioLogueado == null)
            {
                return RedirectToAction("Login", "Usuarios");
            }

            BD.EliminarLibro(id);
            return RedirectToAction("Index", "Home");
        }
        public IActionResult Edit(int id)
        {
            if (BD.UsuarioLogueado == null)
            {
                return RedirectToAction("Login", "Usuarios");
            }

            var libro = BD.ObtenerLibroPorId(id);
            if (libro == null)
            {
                ViewBag.Error = "El libro no existe o fue eliminado.";
                return RedirectToAction("Index", "Home");
            }

            return View(libro);
        }

        [HttpPost]
        public IActionResult Edit(Libros libro)
        {
            if (BD.UsuarioLogueado == null)
            {
                return RedirectToAction("Login", "Usuarios");
            }

            if (string.IsNullOrWhiteSpace(libro.nombre) ||
                string.IsNullOrWhiteSpace(libro.materia) ||
                string.IsNullOrWhiteSpace(libro.ano) ||
                string.IsNullOrWhiteSpace(libro.editorial))
            {
                ViewBag.Error = "Todos los campos son obligatorios.";
                return View(libro);
            }

            BD.EditarLibro(libro);
            return RedirectToAction("Index", "Home");
        }
    }
}
