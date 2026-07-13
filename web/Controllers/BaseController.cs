using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using Bookly.Models;

namespace Bookly.Controllers
{
    /// <summary>
    /// Controlador base. Antes de cada acción carga ViewBag.Notificaciones
    /// con la lista de notificaciones del usuario logueado.
    ///
    /// Para agregar notificaciones desde cualquier action:
    ///   AgregarNotificacion("Título", "Subtítulo", "/ruta/opcional");
    ///
    /// O directamente asignar la lista completa:
    ///   ViewBag.Notificaciones = new List&lt;Notificacion&gt; { ... };
    /// </summary>
    public abstract class BaseController : Controller
    {
        public override void OnActionExecuting(ActionExecutingContext context)
        {
            base.OnActionExecuting(context);

            // Inicializar siempre la lista para que el layout nunca reciba null
            if (ViewBag.Notificaciones == null)
                ViewBag.Notificaciones = new List<Notificacion>();
        }

        /// <summary>
        /// Agrega una notificación a la lista que se renderiza en el panel del header.
        /// Llamar después de que OnActionExecuting haya corrido (es decir, dentro de cualquier action).
        /// </summary>
        protected void AgregarNotificacion(string titulo, string subtitulo, string? vinculo = null, string? iconoSvg = null)
        {
            var lista = ViewBag.Notificaciones as List<Notificacion> ?? new List<Notificacion>();
            lista.Add(new Notificacion(titulo, subtitulo, vinculo, iconoSvg));
            ViewBag.Notificaciones = lista;
        }
    }
}
