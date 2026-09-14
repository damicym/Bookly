using Microsoft.AspNetCore.Mvc;
using Bookly.Models;

namespace Bookly.Controllers
{
    public class ChatController : BaseController
    {
        public IActionResult Chat(string? vendedorDNI, int? idPublicacion)
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

            // Estadísticas del vendedor
            if (!string.IsNullOrWhiteSpace(vendedor.DNI))
            {
                ViewBag.VendedorVentasCerradas = vendedor?.ventasCerradas ?? 0;

                var pubsVendedor = BD.ObtenerPublicacionesCompletasPorUsuario(vendedor.DNI);
                ViewBag.VendedorPublicaciones = pubsVendedor.Where(p => p.status == 1).ToList();
                ViewBag.VendedorPublicacionesActivas = pubsVendedor.Count(p => p.status == 1);

                var resenasVendedor = BD.ObtenerResenasPorReceptor(vendedor.DNI);
                var resenasCompletadas = resenasVendedor
                    .Where(r => r.atencion.HasValue && r.entrega.HasValue)
                    .ToList();
                ViewBag.VendedorResenaCount = resenasCompletadas.Count;
                ViewBag.VendedorPromedioAtencion = resenasCompletadas.Count > 0
                    ? resenasCompletadas.Average(r => (double)r.atencion.Value)
                    : (double?)null;
                ViewBag.VendedorPromedioEntrega = resenasCompletadas.Count > 0
                    ? resenasCompletadas.Average(r => (double)r.entrega.Value)
                    : (double?)null;
            }
            else
            {
                ViewBag.VendedorVentasCerradas = 0;
                ViewBag.VendedorPublicaciones = new List<PublicacionesCompletas>();
                ViewBag.VendedorPublicacionesActivas = 0;
                ViewBag.VendedorResenaCount = 0;
                ViewBag.VendedorPromedioAtencion = (double?)null;
                ViewBag.VendedorPromedioEntrega = (double?)null;
            }

            // Si viene desde "Consultar publicación", pasar los datos de la publi
            if (idPublicacion.HasValue)
            {
                var publi = BD.ObtenerPublicacionCompletaPorId(idPublicacion.Value);
                ViewBag.PublicacionConsulta = publi;
            }

            return View();
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

            var datos = BD.ObtenerMensajesDeChats(user.DNI, 20);
            return Json(datos);
        }

        /// <summary>
        /// GET /Chat/ObtenerMensajes?dniContacto=xxx
        /// Devuelve la conversación entre el usuario logueado y el contacto.
        /// También marca como leídos los mensajes recibidos.
        /// </summary>
        [HttpGet]
        public IActionResult ObtenerMensajes(string dniContacto)
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null) return Unauthorized();

            if (string.IsNullOrWhiteSpace(dniContacto))
                return Json(new List<object>());

            var mensajes = BD.ObtenerMensajes(user.DNI, dniContacto)
                .Select(m => new
                {
                    id         = m.id,
                    idEmisor   = m.idEmisor,
                    idReceptor = m.idReceptor,
                    contenido  = m.contenido,
                    fechaEnvio = m.fechaEnvio,
                    leido      = m.leido
                })
                .ToList();

            return Json(mensajes);
        }

        /// <summary>
        /// POST /Chat/EnviarMensaje
        /// Body: { dniReceptor, contenido }
        /// Envía un mensaje y devuelve el objeto guardado.
        /// </summary>
        [HttpPost]
        public IActionResult EnviarMensaje([FromBody] EnviarMensajeRequest req)
        {
            Usuarios user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null) return Unauthorized();

            if (string.IsNullOrWhiteSpace(req?.DniReceptor) || string.IsNullOrWhiteSpace(req?.Contenido))
                return BadRequest(new { error = "dniReceptor y contenido son requeridos" });

            var mensaje = BD.EnviarMensaje(user.DNI, req.DniReceptor, req.Contenido);
            if (mensaje == null)
                return StatusCode(500, new { error = "No se pudo enviar el mensaje" });

            return Json(new
            {
                id         = mensaje.id,
                idEmisor   = mensaje.idEmisor,
                idReceptor = mensaje.idReceptor,
                contenido  = mensaje.contenido,
                fechaEnvio = mensaje.fechaEnvio,
                leido      = mensaje.leido
            });
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
}
