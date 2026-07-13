using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Bookly.Models;

namespace Bookly.Controllers
{
    public abstract class BaseController : Controller
    {
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            base.OnActionExecuting(context);

            var notifs = new List<Notificacion>();

            // Cargar reseñas pendientes del usuario logueado
            var user = obj.StringToObject<Usuarios>(
                context.HttpContext.Session.GetString("usuarioLogueado"));

            if (user != null)
            {
                try
                {
                    var resenas = BD.ObtenerResenasPorRedactor(user.DNI);

                    foreach (var resena in resenas.Where(r => r.fechaRespuesta == null))
                    {
                        var nombreVendedor = !string.IsNullOrWhiteSpace(resena.nombreReceptor)
                            ? resena.nombreReceptor
                            : "el vendedor";

                        notifs.Add(new Notificacion(
                            titulo:    $"Cuando recibas tu libro, calificá a {nombreVendedor}",
                            subtitulo: "Tocá para dejar tu reseña",
                            vinculo:   null   // se puede agregar la URL de la reseña cuando exista la pantalla
                        ));
                    }
                }
                catch
                {
                    // Si la API no responde, las notificaciones quedan vacías — no rompe la página
                }
            }

            ViewBag.Notificaciones = notifs;
        }

        /// <summary>
        /// Agrega una notificación extra a la lista ya inicializada por OnActionExecuting.
        /// Llamar dentro de cualquier action, después del base.
        /// </summary>
        protected void AgregarNotificacion(string titulo, string subtitulo, string? vinculo = null, string? iconoSvg = null)
        {
            var lista = ViewBag.Notificaciones as List<Notificacion> ?? new List<Notificacion>();
            lista.Add(new Notificacion(titulo, subtitulo, vinculo, iconoSvg));
            ViewBag.Notificaciones = lista;
        }
    }
}
