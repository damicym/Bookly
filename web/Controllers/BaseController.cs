using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Mvc.Filters;
using System.Text.Json;
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
                    var notificaciones = BD.ObtenerNotificacionesPendientes(user.DNI);

                    foreach (var notif in notificaciones)
                    {
                        string vinculo = notif.Vinculo ?? "";

                        // Las notificaciones de reseña pendiente guardan en payload los datos
                        // necesarios para abrir el modal — construimos el vínculo JS aquí.
                        if (notif.Tipo == "resena_pendiente" && notif.Payload != null)
                        {
                            static string PayloadStr(Dictionary<string, object?> p, string key)
                            {
                                if (!p.TryGetValue(key, out var raw) || raw == null) return "";
                                if (raw is System.Text.Json.JsonElement je)
                                    return je.ValueKind == System.Text.Json.JsonValueKind.String
                                        ? je.GetString() ?? ""
                                        : je.ToString();
                                return raw.ToString() ?? "";
                            }

                            var idReceptor    = PayloadStr(notif.Payload, "id_receptor");
                            var nombreRecep   = PayloadStr(notif.Payload, "nombre_receptor");
                            var idPub         = notif.Payload.TryGetValue("id_publicacion", out var vP) && vP is System.Text.Json.JsonElement jeP && jeP.ValueKind != System.Text.Json.JsonValueKind.Null
                                                    ? jeP.ToString()
                                                    : "null";
                            var nombreLibro   = PayloadStr(notif.Payload, "nombre_libro");

                            var nombreEscapado      = nombreRecep.Replace("'", "\\'");
                            var nombreLibroEscapado = nombreLibro.Replace("'", "\\'");

                            vinculo = $"javascript:abrirResenaModal('{idReceptor}','{nombreEscapado}','',{idPub},'{nombreLibroEscapado}')";
                        }

                        notifs.Add(new Notificacion(
                            titulo:    notif.Titulo,
                            subtitulo: notif.Subtitulo ?? "",
                            vinculo:   vinculo
                        ));
                    }
                }
                catch
                {
                    // Si la API no responde, las notificaciones quedan vacías — no rompe la página
                }

                // Mensajes no leídos para el badge del navbar
                try
                {
                    var noLeidos = BD.ObtenerNoLeidos(user.DNI);
                    ViewBag.TieneNoLeidos = noLeidos.Values.Any(v => v > 0);
                }
                catch
                {
                    ViewBag.TieneNoLeidos = false;
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
