using Microsoft.AspNetCore.Mvc;
using Bookly.Models;

namespace Bookly.Controllers
{
    public class UsuariosController : Controller
    {
        public IActionResult Login()
        {
            if (BD.UsuarioLogueado != null)
            {
                ViewBag.UsuarioNombre = BD.UsuarioLogueado.nombreComp;
            }
            return View();
        }
        [HttpPost]
        public IActionResult Login(string DNI, string password)
        {
            var usuario = BD.login(DNI, password);
            if (usuario != null)
            {
                ViewBag.UsuarioNombre = usuario.nombreComp;
                return RedirectToAction("Index", "Home");
            }
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
        [HttpGet]
        public IActionResult Profile()
        {
            if (BD.UsuarioLogueado == null)
            {
                return RedirectToAction("Login");
            }
            ViewBag.UsuarioNombre = BD.UsuarioLogueado.nombreComp;
            return View(BD.UsuarioLogueado);
        }

    }
}