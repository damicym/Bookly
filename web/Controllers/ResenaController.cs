using Microsoft.AspNetCore.Mvc;
using Bookly.Models;

namespace Bookly.Controllers
{
    public class ResenaController : BaseController
    {
        /// <summary>
        /// POST /Resena/Enviar
        /// Recibe las puntuaciones del formulario, calcula los promedios por eje
        /// y los persiste en la base de datos a través de la API.
        ///
        /// Body JSON esperado:
        /// {
        ///   "id":            int,     -- id de la fila en resenas (de la notificación)
        ///   "p1_atencion":   int,     -- obligatorio, 1-5
        ///   "p2_entrega":    int,     -- obligatorio, 1-5
        ///   "p3_entrega":    int?,    -- opcional,    1-5
        ///   "p4_experiencia": int?,   -- opcional,    1-5
        ///   "comentario":    string,  -- opcional
        ///   "problema":      string   -- opcional
        /// }
        /// </summary>
        [HttpPost]
        public IActionResult Enviar([FromBody] EnviarResenaDto dto)
        {
            // Requiere sesión activa
            var user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null)
                return Unauthorized(new { success = false, message = "Sesión expirada" });

            // Validación básica de campos obligatorios
            if (dto == null || dto.Id <= 0 || dto.P1Atencion < 1 || dto.P1Atencion > 5
                            || dto.P2Entrega < 1  || dto.P2Entrega > 5)
                return BadRequest(new { success = false, message = "Datos inválidos" });

            // Validar opcionales si se enviaron
            if ((dto.P3Entrega.HasValue    && (dto.P3Entrega    < 1 || dto.P3Entrega    > 5)) ||
                (dto.P4Experiencia.HasValue && (dto.P4Experiencia < 1 || dto.P4Experiencia > 5)))
                return BadRequest(new { success = false, message = "Puntuaciones fuera de rango" });

            // Calcular promedios por eje (misma lógica que el JS del frontend)
            var atencion = dto.P4Experiencia.HasValue
                ? (short)Math.Round((dto.P1Atencion + dto.P4Experiencia.Value) / 2.0)
                : dto.P1Atencion;

            var entrega = dto.P3Entrega.HasValue
                ? (short)Math.Round((dto.P2Entrega + dto.P3Entrega.Value) / 2.0)
                : dto.P2Entrega;

            var ok = BD.EnviarResena(
                id:            dto.Id,
                p1Atencion:    dto.P1Atencion,
                p2Entrega:     dto.P2Entrega,
                p3Entrega:     dto.P3Entrega,
                p4Experiencia: dto.P4Experiencia,
                atencion:      atencion,
                entrega:       entrega,
                comentario:    dto.Comentario ?? "",
                problema:      dto.Problema   ?? ""
            );

            if (!ok)
                return StatusCode(500, new { success = false, message = "No se pudo guardar la reseña" });

            return Ok(new { success = true });
        }
    }

    /// <summary>DTO que mapea el body JSON del formulario de reseña.</summary>
    public class EnviarResenaDto
    {
        [System.Text.Json.Serialization.JsonPropertyName("id")]
        public int Id { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("p1_atencion")]
        public short P1Atencion { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("p2_entrega")]
        public short P2Entrega { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("p3_entrega")]
        public short? P3Entrega { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("p4_experiencia")]
        public short? P4Experiencia { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("comentario")]
        public string? Comentario { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("problema")]
        public string? Problema { get; set; }
    }
}
