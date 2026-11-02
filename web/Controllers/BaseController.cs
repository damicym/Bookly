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

                    // Helper para leer un campo string del payload de una notificación
                    static string PayloadStr(Dictionary<string, object?> p, string key)
                    {
                        if (!p.TryGetValue(key, out var raw) || raw == null) return "";
                        if (raw is System.Text.Json.JsonElement je)
                            return je.ValueKind == System.Text.Json.JsonValueKind.String
                                ? je.GetString() ?? ""
                                : je.ToString();
                        return raw.ToString() ?? "";
                    }

                    foreach (var notif in notificaciones)
                    {
                        string vinculo = notif.Vinculo ?? "";

                        // Las notificaciones de reseña pendiente guardan en payload los datos
                        // necesarios para abrir el modal — construimos el vínculo JS aquí.
                        if (notif.Tipo == "resena_pendiente" && notif.Payload != null)
                        {
                            var idReceptor    = PayloadStr(notif.Payload, "id_receptor");
                            var nombreRecep   = PayloadStr(notif.Payload, "nombre_receptor");
                            var idPub         = notif.Payload.TryGetValue("id_publicacion", out var vP) && vP is System.Text.Json.JsonElement jeP && jeP.ValueKind != System.Text.Json.JsonValueKind.Null
                                                    ? jeP.ToString()
                                                    : "null";
                            var nombreLibro   = PayloadStr(notif.Payload, "nombre_libro");

                            var nombreEscapado      = nombreRecep.Replace("'", "\\'");
                            var nombreLibroEscapado = nombreLibro.Replace("'", "\\'");

                            vinculo = $"javascript:abrirResenaModal('{idReceptor}','{nombreEscapado}','',{idPub},'{nombreLibroEscapado}',{notif.Id})";
                        }

                        // Notificación de acuerdo aceptado: recordatorio con fecha/hora/lugar
                        string? iconoCalendario = null;
                        if (notif.Tipo == "acuerdo_aceptado" && notif.Payload != null)
                        {
                            var fecha  = PayloadStr(notif.Payload, "fecha");
                            var hora   = PayloadStr(notif.Payload, "hora");
                            var lugar  = PayloadStr(notif.Payload, "lugar");
                            var nombre = PayloadStr(notif.Payload, "nombre_libro");

                            // Subtítulo enriquecido: "El dd/mm/yyyy a las HH:MM en Lugar"
                            if (!string.IsNullOrWhiteSpace(fecha))
                            {
                                var subtituloDetalle = $"El {fecha} a las {hora} • {lugar}";
                                notifs.Add(new Notificacion(
                                    titulo:    notif.Titulo,
                                    subtitulo: subtituloDetalle,
                                    vinculo:   vinculo,
                                    iconoSvg:  @"<svg xmlns=""http://www.w3.org/2000/svg"" width=""18"" height=""18"" viewBox=""0 0 24 24"" fill=""none"" stroke=""currentColor"" stroke-width=""2"" stroke-linecap=""round"" stroke-linejoin=""round""><rect x=""3"" y=""4"" width=""18"" height=""18"" rx=""2"" ry=""2""/><line x1=""16"" y1=""2"" x2=""16"" y2=""6""/><line x1=""8"" y1=""2"" x2=""8"" y2=""6""/><line x1=""3"" y1=""10"" x2=""21"" y2=""10""/></svg>"
                                ));
                                continue;
                            }
                        }

                        notifs.Add(new Notificacion(
                            titulo:    notif.Titulo,
                            subtitulo: notif.Subtitulo ?? "",
                            vinculo:   vinculo,
                            iconoSvg:  iconoCalendario
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
