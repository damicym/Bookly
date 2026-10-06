using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Bookly.Models;
using Bookly.Hubs;

namespace Bookly.Controllers
{
    public class ChatController : BaseController
    {
        private readonly IHubContext<ChatHub> _hubContext;

        public ChatController(IHubContext<ChatHub> hubContext)
        {
            _hubContext = hubContext;
        }

        public IActionResult Index(string? vendedorDNI, int? idPublicacion)
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null)
            {
                return RedirectToAction("Login", "Usuarios");
            }

            ViewBag.usuario = user;

            // Cargar datos reales del vendedor si se recibe un DNI
            Usuarios vendedor = null;
            if (!string.IsNullOrWhiteSpace(vendedorDNI))
            {
                vendedor = BD.ObtenerUsuarioPorDNI(vendedorDNI);
            }

            // Fallback cuando no hay vendedor específico
            if (vendedor == null)
            {
                vendedor = new Usuarios
                {
                    DNI          = "",
                    nombreComp   = "",
                    ano          = null,
                    especialidad = "",
                    curso        = "",
                    aboutMe      = "",
                    fotoPerfil   = null
                };
            }

            ViewBag.Vendedor = vendedor;

            // Registrar el chat en el historial del usuario logueado
            if (!string.IsNullOrWhiteSpace(vendedor.DNI))
            {
                BD.UpsertChat(user.DNI, vendedor.DNI);
            }

            // Si viene desde "Consultar publicación", pasar los datos de la publi
            if (idPublicacion.HasValue)
            {
                var publi = BD.ObtenerPublicacionCompletaPorId(idPublicacion.Value);
                ViewBag.PublicacionConsulta = publi;
            }

            return View("Chat");
        }

        /// <summary>
        /// GET /Chat/ObtenerNoLeidos
        /// Devuelve { "dniContacto": count } con mensajes no leídos del usuario logueado.
        /// Lo consumen tanto el layout (navbar badge) como chat.js (sidebar badges).
        /// </summary>
        [HttpGet]
        public IActionResult ObtenerNoLeidos()
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null) return Unauthorized();
            var noLeidos = BD.ObtenerNoLeidos(user.DNI);
            return Json(noLeidos);
        }

        /// <summary>
        /// GET /Chat/BuscarUsuarios?q=texto
        /// Devuelve JSON con lista de usuarios que coinciden con el query.
        /// Excluye al usuario logueado de los resultados.
        /// </summary>
        [HttpGet]
        public IActionResult BuscarUsuarios(string q)
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null) return Unauthorized();

            if (string.IsNullOrWhiteSpace(q) || q.Trim().Length < 2)
                return Json(new List<object>());

            var resultados = BD.BuscarUsuarios(q)
                .Where(u => u.DNI != user.DNI)
                .Select(u => new
                {
                    dni          = u.DNI,
                    nombre       = u.nombreComp,
                    especialidad = u.especialidad,
                    curso        = u.curso,
                    ano          = u.ano,
                    fotoPerfil   = u.fotoPerfil
                })
                .ToList();

            return Json(resultados);
        }

        /// <summary>
        /// GET /Chat/ObtenerChats
        /// Devuelve el historial de chats del usuario logueado en JSON.
        /// Lo consume el sidebar via fetch al cargar la página.
        /// </summary>
        [HttpGet]
        public IActionResult ObtenerChats()
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null) return Unauthorized();

            var chats = BD.ObtenerChats(user.DNI)
                .Select(c => new
                {
                    idContacto   = c.idContacto,
                    nombreComp   = c.nombreComp,
                    ano          = c.ano,
                    especialidad = c.especialidad,
                    fotoPerfil   = c.fotoPerfil,
                    createdAt    = c.createdAt
                })
                .ToList();

            return Json(chats);
        }

        /// <summary>
        /// GET /Chat/PrefetchMensajes
        /// Devuelve todos los mensajes de los últimos 20 chats del usuario logueado,
        /// agrupados por DNI del contacto. Lo consume el JS al cargar la página.
        /// </summary>
        [HttpGet]
        public IActionResult PrefetchMensajes()
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null) return Unauthorized();

            var datos = BD.ObtenerMensajesDeChats(user.DNI, 10); // LIMITAR CHATS DE PREFETCH A 10

            // Proyectar a camelCase para que el JS pueda leer msg.idEmisor / msg.idReceptor
            // (el modelo Mensaje usa [JsonPropertyName("id_emisor")] que produce snake_case
            // al serializar directamente, pero el JS espera camelCase).
            var resultado = datos.ToDictionary(
                kvp => kvp.Key,
                kvp => kvp.Value.Select(m => new
                {
                    id         = m.id,
                    idEmisor   = m.idEmisor,
                    idReceptor = m.idReceptor,
                    contenido  = m.contenido,
                    fechaEnvio = m.fechaEnvio,
                    leido      = m.leido,
                    editado    = m.editado
                }).ToList()
            );
            return Json(resultado);
        }

        /// <summary>
        /// GET /Chat/ObtenerMensajes?dniContacto=xxx&antes=ISO8601
        /// Devuelve la conversación entre el usuario logueado y el contacto.
        /// Si se proporciona 'antes', devuelve solo mensajes anteriores a esa fecha (lazy loading).
        /// También marca como leídos los mensajes recibidos.
        /// </summary>
        [HttpGet]
        public IActionResult ObtenerMensajes(string dniContacto, string antes = null)
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null) return Unauthorized();

            if (string.IsNullOrWhiteSpace(dniContacto))
                return Json(new List<object>());

            var mensajes = BD.ObtenerMensajes(user.DNI, dniContacto, antes)
                .Select(m => new
                {
                    id         = m.id,
                    idEmisor   = m.idEmisor,
                    idReceptor = m.idReceptor,
                    contenido  = m.contenido,
                    fechaEnvio = m.fechaEnvio,
                    leido      = m.leido,
                    editado    = m.editado
                })
                .ToList();

            return Json(mensajes);
        }

        /// <summary>
        /// POST /Chat/EnviarMensaje
        /// Body: { dniReceptor, contenido }
        /// Envía un mensaje, lo persiste via API y notifica al receptor en tiempo real via SignalR.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> EnviarMensaje([FromBody] EnviarMensajeRequest req)
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null) return Unauthorized();

            if (string.IsNullOrWhiteSpace(req?.DniReceptor) || string.IsNullOrWhiteSpace(req?.Contenido))
                return BadRequest(new { error = "dniReceptor y contenido son requeridos" });

            var mensaje = BD.EnviarMensaje(user.DNI, req.DniReceptor, req.Contenido);
            if (mensaje == null)
                return StatusCode(500, new { error = "No se pudo enviar el mensaje" });

            var payload = new
            {
                id         = mensaje.id,
                idEmisor   = mensaje.idEmisor,
                idReceptor = mensaje.idReceptor,
                contenido  = mensaje.contenido,
                fechaEnvio = mensaje.fechaEnvio,
                leido      = mensaje.leido,
                editado    = mensaje.editado
            };

            // Notificar al receptor en tiempo real (si está conectado y en su grupo)
            await _hubContext.Clients.Group(req.DniReceptor).SendAsync("NuevoMensaje", payload);

            return Json(payload);
        }

        /// <summary>
        /// GET /Chat/ObtenerInfoContacto?dniContacto=xxx
        /// Paso 1 del widget progresivo: datos básicos del contacto (nombre, año, foto, etc.)
        /// </summary>
        [HttpGet]
        public IActionResult ObtenerInfoContacto(string dniContacto)
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null) return Unauthorized();

            if (string.IsNullOrWhiteSpace(dniContacto))
                return Json(null);

            var contacto = BD.ObtenerUsuarioPorDNI(dniContacto);
            if (contacto == null) return Json(null);

            return Json(new
            {
                dni          = contacto.DNI,
                nombreComp   = contacto.nombreComp,
                ano          = contacto.ano,
                anoTexto     = Helpers.HtmlHelpers.PasarAñoATextoCompleto(contacto.ano),
                especialidad = contacto.especialidad,
                curso        = contacto.curso,
                aboutMe      = contacto.aboutMe,
                fotoPerfil   = contacto.fotoPerfil,
                ventasCerradas = contacto.ventasCerradas
            });
        }

        /// <summary>
        /// GET /Chat/ObtenerResenasContacto?dniContacto=xxx
        /// Paso 2 del widget progresivo: promedios de reseñas del contacto.
        /// </summary>
        [HttpGet]
        public IActionResult ObtenerResenasContacto(string dniContacto)
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null) return Unauthorized();

            if (string.IsNullOrWhiteSpace(dniContacto))
                return Json(new { resenaCount = 0, promedioAtencion = (double?)null, promedioEntrega = (double?)null });

            var resenas = BD.ObtenerResenasPorReceptor(dniContacto)
                            .Where(r => r.atencion.HasValue && r.entrega.HasValue).ToList();

            return Json(new
            {
                resenaCount      = resenas.Count,
                promedioAtencion = resenas.Count > 0 ? resenas.Average(r => (double)r.atencion.Value) : (double?)null,
                promedioEntrega  = resenas.Count > 0 ? resenas.Average(r => (double)r.entrega.Value)  : (double?)null,
            });
        }

        /// <summary>
        /// GET /Chat/ObtenerPublicacionesContacto?dniContacto=xxx
        /// Paso 3 del widget progresivo: publicaciones activas del contacto.
        /// </summary>
        [HttpGet]
        public IActionResult ObtenerPublicacionesContacto(string dniContacto)
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null) return Unauthorized();

            if (string.IsNullOrWhiteSpace(dniContacto))
                return Json(new { activas = 0, publicaciones = new List<object>() });

            var pubs = BD.ObtenerPublicacionesCompletasPorUsuario(dniContacto)
                         .Where(p => p.status == 1).ToList();

            return Json(new
            {
                activas = pubs.Count,
                publicaciones = pubs.Select(p => new
                {
                    id     = p.id,
                    nombre = p.nombre,
                    precio = p.precio,
                    imagen = p.imagen
                }).ToList()
            });
        }

        /// <summary>
        /// GET /Chat/ObtenerPublicacionesChat?dniContacto=xxx
        /// Devuelve las publicaciones activas del usuario logueado y del contacto,
        /// separadas por sección. Lo consume el picker "+" del input de chat.
        /// </summary>
        [HttpGet]
        public IActionResult ObtenerPublicacionesChat(string dniContacto)
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null) return Unauthorized();

            var misPublicaciones = BD.ObtenerPublicacionesCompletasPorUsuario(user.DNI)
                .Where(p => p.status == 1)
                .Select(p => new { id = p.id, nombre = p.nombre, precio = p.precio, imagen = p.imagen })
                .ToList();

            var pubsContacto = new List<object>();
            if (!string.IsNullOrWhiteSpace(dniContacto))
            {
                pubsContacto = BD.ObtenerPublicacionesCompletasPorUsuario(dniContacto)
                    .Where(p => p.status == 1)
                    .Select(p => new { id = p.id, nombre = p.nombre, precio = p.precio, imagen = p.imagen })
                    .Cast<object>()
                    .ToList();
            }

            return Json(new { mias = misPublicaciones, contacto = pubsContacto });
        }

        /// <summary>
        /// PATCH /Chat/EditarMensaje
        /// Body: { id, nuevoContenido }
        /// Edita el contenido de un mensaje propio y notifica al receptor via SignalR.
        /// </summary>
        [HttpPost]
        public async Task<IActionResult> EditarMensaje([FromBody] EditarMensajeRequest req)
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null) return Unauthorized();

            if (req == null || req.Id <= 0 || string.IsNullOrWhiteSpace(req.NuevoContenido))
                return BadRequest(new { error = "id y nuevoContenido son requeridos" });

            var mensaje = BD.EditarMensaje(req.Id, user.DNI, req.NuevoContenido);
            if (mensaje == null)
                return NotFound(new { error = "Mensaje no encontrado o no autorizado" });

            var payload = new
            {
                id           = mensaje.id,
                idEmisor     = mensaje.idEmisor,
                contenido    = mensaje.contenido,
                editado      = mensaje.editado,
                fechaEdicion = (DateTime?)null   // la API ya notificó via Socket.IO al receptor
            };

            // Notificar al receptor via SignalR (web)
            await _hubContext.Clients.Group(mensaje.idReceptor).SendAsync("MensajeEditado", payload);

            return Json(payload);
        }

        /// <summary>
        /// POST /Chat/EliminarMensaje
        /// Body: { id }
        /// Soft-delete de un mensaje propio. La notificación en tiempo real
        /// al receptor ya la realiza la API Node via Socket.IO.
        /// </summary>
        [HttpPost]
        public IActionResult EliminarMensaje([FromBody] EliminarMensajeRequest req)
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null) return Unauthorized();

            if (req == null || req.Id <= 0)
                return BadRequest(new { error = "id es requerido" });

            var ok = BD.EliminarMensaje(req.Id, user.DNI);
            if (!ok)
                return NotFound(new { error = "Mensaje no encontrado o no autorizado" });

            return Json(new { ok = true, id = req.Id });
        }

        /// <summary>
        /// POST /Chat/UpsertChat
        /// Body: { dniContacto }
        /// Registra o actualiza el chat en el historial del usuario logueado.
        /// Llamado desde el JS del modal de nueva conversación.
        /// </summary>
        [HttpPost]
        public IActionResult UpsertChat([FromBody] UpsertChatRequest req)
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null) return Unauthorized();

            if (string.IsNullOrWhiteSpace(req?.DniContacto))
                return BadRequest(new { error = "dniContacto es requerido" });

            BD.UpsertChat(user.DNI, req.DniContacto);
            return Ok();
        }
    }

    /// <summary>DTO para el body del POST EnviarMensaje.</summary>
    public class EnviarMensajeRequest
    {
        public string DniReceptor { get; set; }
        public string Contenido   { get; set; }
    }

    /// <summary>DTO para el body del POST UpsertChat.</summary>
    public class UpsertChatRequest
    {
        public string DniContacto { get; set; }
    }

    /// <summary>DTO para el body del POST EditarMensaje.</summary>
    public class EditarMensajeRequest
    {
        public int    Id            { get; set; }
        public string NuevoContenido { get; set; }
    }

    /// <summary>DTO para el body del POST EliminarMensaje.</summary>
    public class EliminarMensajeRequest
    {
        public int Id { get; set; }
    }
}
