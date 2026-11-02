using Microsoft.AspNetCore.Mvc;
using Bookly.Models;

namespace Bookly.Controllers
{
    public class NotificacionController : BaseController
    {
        /// <summary>
        /// POST /Notificacion/MarcarLeida
        /// Marca una notificación como leída para el usuario logueado.
        /// Body JSON: { "id": long }
        /// </summary>
        [HttpPost]
        public IActionResult MarcarLeida([FromBody] MarcarLeidaDto dto)
        {
            var user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null) return Unauthorized();
            if (dto == null || dto.Id <= 0) return BadRequest();

            BD.MarcarNotificacionLeida(dto.Id, user.DNI);
            return Ok(new { success = true });
        }
    }

    public class MarcarLeidaDto
    {
        [System.Text.Json.Serialization.JsonPropertyName("id")]
        public long Id { get; set; }
    }
}
