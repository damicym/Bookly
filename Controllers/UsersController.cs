using Microsoft.AspNetCore.Mvc;
using Bookly.Models;

namespace Bookly.Controllers
{
    // public class UsersController : Controller
    // {
    //     public IActionResult Login()
    //     {
    //         return View();
    //     }

    //     [HttpPost]
    //     public IActionResult LoginGuardar(string username, string password)
    //     {
    //         if (string.IsNullOrEmpty(username) || string.IsNullOrEmpty(password))
    //         {
    //             ViewBag.Error = "Complete todos los campos";
    //             return View("Login");
    //         }

    //         Usuarios usuario = BD.login(username, password);

    //         if (usuario != null)
    //         {
    //             BD.actLogin(usuario.mail);
    //             return RedirectToAction("VerTareas", "Home");
    //         }
    //         else
    //         {
    //             ViewBag.Error = "Usuario o contraseña incorrectos";
    //             return View("Login");
    //         }
    //     }
    // }
}
