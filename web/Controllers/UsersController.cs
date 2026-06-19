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
                return RedirectToAction("Index", "Home");
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
            if (user == null) return RedirectToAction("Login");
            aboutMe = aboutMe ?? "";
            BD.ActualizarAboutMe(user.DNI, aboutMe);
            user.aboutMe = aboutMe;
            HttpContext.Session.SetString("usuarioLogueado", obj.ObjectToString(user));
            return RedirectToAction("Profile", "Home");
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult DeleteFotoPerfil()
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null)
                return Json(new { success = false, message = "No autenticado" });

            var ok = BD.EliminarFotoPerfil(user.DNI);
            if (!ok)
                return Json(new { success = false, message = "Error al eliminar la foto" });

            user.fotoPerfil = null;
            HttpContext.Session.SetString("usuarioLogueado", obj.ObjectToString(user));
            return Json(new { success = true });
        }

        [HttpPost]
        [ValidateAntiForgeryToken]
        public IActionResult UpdateFotoPerfil(IFormFile fotoPerfil)
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null)
                return Json(new { success = false, message = "No autenticado" });

            if (fotoPerfil == null || fotoPerfil.Length == 0)
                return Json(new { success = false, message = "Archivo inválido" });

            if (fotoPerfil.Length > 5 * 1024 * 1024)
                return Json(new { success = false, message = "La imagen no puede superar 5MB" });

            var url = BD.SubirFotoPerfil(user.DNI, fotoPerfil);
            if (url == null){
                return Json(new { success = false, message = "Error al subir la foto" });
            }

            user.fotoPerfil = url;
            HttpContext.Session.SetString("usuarioLogueado", obj.ObjectToString(user));

            return Json(new { success = true, src = url, url = url });
        }

    }
}