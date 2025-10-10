using Microsoft.AspNetCore.Mvc;
using Bookly.Models;

namespace Bookly.Controllers
{
    public class UsuariosController : Controller
    {
        public IActionResult Login()
        {
            return View();
        }
        [HttpPost]
        public IActionResult Login(string DNI, string password)
        {
            var usuario = BD.login(DNI, password);
            if (usuario != null) return RedirectToAction("Index", "Home");
            ViewBag.Error = "DNI o contraseña incorrectos";
            return View();
        }

        public IActionResult Register()
        {
            return View();
        }
        [HttpPost]
        public IActionResult Register(Usuarios usuario)
        {
            if (BD.ExisteUsuario(usuario.DNI))
            {
                ViewBag.Error = $"No se puede registrar: el usuario con DNI {usuario.DNI} ya tiene una cuenta en bookly.";
                return View(usuario);
            }

            BD.registrarse(usuario);
            return RedirectToAction("Login");
        }
    }
}
