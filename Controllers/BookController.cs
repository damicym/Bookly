using Microsoft.AspNetCore.Mvc;
using Bookly.Models;

namespace Bookly.Controllers
{
    public class BookController : Controller
    {
        public IActionResult Index(){
            if (BD.UsuarioLogueado == null)
            {
                return RedirectToAction("Login", "Usuarios");
            }

            ViewBag.UsuarioNombre = BD.UsuarioLogueado.nombreComp;
            var libros = BD.ObtenerLibros();
            return View(libros);
        }

        public IActionResult Publicar(){
            if (BD.UsuarioLogueado == null)
            {
                return RedirectToAction("Login", "Usuarios");
            }
            return View();
        }

        [HttpPost]
        [HttpPost]
    public IActionResult Publicar(Libros libro, decimal precio, string estadoLibro, string descripcion)
    {
        Usuarios usuario = obj.StringToObject<Usuarios>( HttpContext.Session.GetString("usuarioLogueado"));

        if (usuario == null)
        {
            return RedirectToAction("Login", "Usuarios");
        }

        if (string.IsNullOrWhiteSpace(libro.nombre) ||
            string.IsNullOrWhiteSpace(libro.materia) ||
            string.IsNullOrWhiteSpace(libro.ano) ||
            string.IsNullOrWhiteSpace(libro.editorial) ||
            string.IsNullOrWhiteSpace(estadoLibro) ||
            string.IsNullOrWhiteSpace(descripcion))
        {
            ViewBag.Error = "Todos los campos son obligatorios.";
            return View(libro);
        }

        BD.PublicarLibro(libro, usuario.DNI, precio, estadoLibro, descripcion);
        return RedirectToAction("Profile", "Home");
    }

        [HttpGet]
        public IActionResult Detalle(int id){
            var libro = BD.ObtenerLibroPorId(id);
            if (libro == null)
            {
                return RedirectToAction("Index", "Home");
            }
            return View(libro);
        }

        [HttpPost]
        public IActionResult Eliminar(int id){
            BD.EliminarLibro(id);
            return RedirectToAction("Index", "Home");
        }
        public IActionResult Edit(int id){
            var libro = BD.ObtenerLibroPorId(id);
            if (libro == null)
            {
                ViewBag.Error = "El libro no existe o fue eliminado.";
                return RedirectToAction("Index", "Home");
            }

            return View(libro);
        }

        [HttpPost]
        public IActionResult Edit(Libros libro){
            if (string.IsNullOrWhiteSpace(libro.nombre) ||
                string.IsNullOrWhiteSpace(libro.materia) ||
                string.IsNullOrWhiteSpace(libro.ano) ||
                string.IsNullOrWhiteSpace(libro.editorial))
            {
                ViewBag.Error = "Todos los campos son obligatorios.";
                return View(libro);
            }

            BD.EditarLibro(libro);
            return RedirectToAction("Profile", "Home");
        }
    }
}
