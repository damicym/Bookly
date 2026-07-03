using Microsoft.AspNetCore.Mvc;
using Bookly.Models;

namespace Bookly.Controllers
{
    public class ChatController : Controller
    {
        public IActionResult Chat()
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null)
            {
                return RedirectToAction("Login", "Usuarios");
            }

            ViewBag.usuario = user;

            // Hardcoded vendor data — will be replaced when wired to real data
            var vendedor = new Usuarios
            {
                DNI        = "00000000",
                nombreComp = "María González",
                ano        = 3,
                especialidad = "Sistemas",
                curso      = "",
                aboutMe    = "Vendo libros en buen estado. Respondo rápido.",
                fotoPerfil = null
            };

            ViewBag.Vendedor = vendedor;
            ViewBag.VendedorVentasCerradas = 14;

            return View();
        }
    }
}
