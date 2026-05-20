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
                return RedirectToAction("Index", "Home");
            }
            // Redirigir a la home con parámetro para abrir el modal
            return Redirect("/?modal=login&returnView=" + returnView);
        }
        [HttpPost]
        public IActionResult Login(string DNI, string password, string returnView = "Index")
        {
            Usuarios usuario = BD.login(DNI, password);
            if (usuario != null)
            {
                HttpContext.Session.SetString("usuarioLogueado", obj.ObjectToString(usuario));
                TempData["WelcomeUser"] = usuario.nombreComp;
                if (returnView == "Publicar") return RedirectToAction("Publicar", "Book");
                return RedirectToAction(returnView, "Home");
            }
            TempData["ModalError"] = "DNI o contraseña incorrectos";
            TempData["ModalErrorTarget"] = "login";
            return Redirect("/?modal=login&returnView=" + returnView);
        }

        public IActionResult isLogged() {
            ViewBag.UsuarioRegistrado = HttpContext.Session.GetString("usuarioLogueado") != null;
            return View();
        }

        public IActionResult Register()
        {
            // Redirigir a la home con parámetro para abrir el modal
            return Redirect("/?modal=register");
        }
        [HttpPost]
        public IActionResult Register(Usuarios usuario)
        {
            if (BD.ExisteUsuario(usuario.DNI))
            {
                TempData["ModalError"] = $"El DNI {usuario.DNI} ya tiene una cuenta en Bookly.";
                TempData["ModalErrorTarget"] = "register";
                return Redirect("/?modal=register");
            }
            BD.registrarse(usuario);
            TempData["ModalError"] = null;
            return Redirect("/?modal=login");
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
            if (user == null)
            {
                return RedirectToAction("Login");
            }

            // Guardar aunque sea string vacío (permite borrar la descripción)
            aboutMe = aboutMe ?? "";
            BD.ActualizarAboutMe(user.DNI, aboutMe);
            user.aboutMe = aboutMe;
            HttpContext.Session.SetString("usuarioLogueado", obj.ObjectToString(user));
            return RedirectToAction("Profile", "Home");
        }

    }
}