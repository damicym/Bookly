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

                        // Escapar comillas simples para uso seguro en el atributo onclick
                        var nombreEscapado = nombreVendedor.Replace("'", "\\'");

                        notifs.Add(new Notificacion(
                            titulo:    $"Calificá a {nombreVendedor}",
                            subtitulo: "Tocá para dejar tu reseña",
                            vinculo:   $"javascript:abrirResenaModal({resena.id},'{nombreEscapado}','')"
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
