using Microsoft.AspNetCore.Mvc;
using Bookly.Models;

namespace Bookly.Controllers
{
    public class UsuariosController : Controller
    {
        public IActionResult Login(string returnView = "Index")
        { 
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user != null)
            {
                ViewBag.UsuarioNombre = user.nombreComp;
            }
            ViewBag.returnView = returnView;
            return View();
        }
        [HttpPost]
        public IActionResult Login(string DNI, string password, string returnView = "Index")
        {
            Usuarios usuario = BD.login(DNI, password);
            if (usuario != null)
            {
                HttpContext.Session.SetString("usuarioLogueado", obj.ObjectToString(usuario));
                if (returnView == "Publicar") return RedirectToAction("Publicar", "Book");
                return RedirectToAction(returnView, "Home");
            }
            ViewBag.Error = "DNI o contraseña incorrectos";
            ViewBag.returnView = returnView;
            return View();
        }

        public IActionResult isLogged() {
            ViewBag.UsuarioRegistrado = HttpContext.Session.GetString("usuarioLogueado") != null;
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
                ViewBag.Error = $"No se puede registrar: el usuario con DNI {usuario.DNI} ya tiene una cuenta en Bookly.";
                return View(usuario);
            }
            BD.registrarse(usuario);
            return RedirectToAction("Login");
        }
        [HttpGet]
        public IActionResult Logout()
        {
            HttpContext.Session.Remove("usuarioLogueado");
            return RedirectToAction("Login");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult UpdateAboutMe(string aboutMe)
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null)            {
                return RedirectToAction("Login");
            } else {
                BD.ActualizarAboutMe(user.DNI, aboutMe);
                user.aboutMe = aboutMe;
                HttpContext.Session.SetString("usuarioLogueado", obj.ObjectToString(user));
                return RedirectToAction("Profile", "Home");
            }
        }

    }
}