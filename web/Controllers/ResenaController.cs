using Microsoft.AspNetCore.Mvc;
using Bookly.Models;

namespace Bookly.Controllers
{
    public class ResenaController : BaseController
    {
        /// <summary>
        /// POST /Resena/Enviar
        /// Inserta una nueva reseña en la base de datos.
        ///
        /// Body JSON esperado:
        /// {
        ///   "id_receptor": string,  -- DNI del vendedor que recibe la reseña
        ///   "atencion":    int,     -- promedio eje atención, 1-5
        ///   "entrega":     int,     -- promedio eje entrega,  1-5
        ///   "responsable": int,     -- puntaje responsabilidad, 1-5
        ///   "proceso":     int,     -- puntaje experiencia Bookly, 1-5
        ///   "comentario":  string?, -- opcional
        ///   "problema":    string?  -- opcional
        /// }
        /// El id_redactor se toma de la sesión activa.
        /// </summary>
        [HttpPost]
        public IActionResult Enviar([FromBody] EnviarResenaDto dto)
        {
            var user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null)
                return Unauthorized(new { success = false, message = "Sesión expirada" });

            Console.WriteLine($"[Resena.Enviar] dto={System.Text.Json.JsonSerializer.Serialize(dto)} user.DNI={user.DNI}");

            if (dto == null
                || string.IsNullOrWhiteSpace(dto.IdReceptor)
                || dto.Atencion    < 1 || dto.Atencion    > 5
                || dto.Entrega     < 1 || dto.Entrega     > 5
                || dto.Responsable < 1 || dto.Responsable > 5
                || dto.Proceso     < 1 || dto.Proceso     > 5)
            {
                Console.WriteLine($"[Resena.Enviar] Validación fallida: receptor='{dto?.IdReceptor}', atencion={dto?.Atencion}, entrega={dto?.Entrega}, responsable={dto?.Responsable}, proceso={dto?.Proceso}");
                return BadRequest(new { success = false, message = "Datos inválidos" });
            }

            var ok = BD.EnviarResena(
                idRedactor:    user.DNI,
                idReceptor:    dto.IdReceptor,
                atencion:      dto.Atencion,
                entrega:       dto.Entrega,
                responsable:   dto.Responsable,
                proceso:       dto.Proceso,
                comentario:    dto.Comentario    ?? "",
                problema:      dto.Problema      ?? "",
                idPublicacion: dto.IdPublicacion
            );

            if (!ok)
                return StatusCode(500, new { success = false, message = "No se pudo guardar la reseña" });

            return Ok(new { success = true });
        }
    }

    public class EnviarResenaDto
    {
        [System.Text.Json.Serialization.JsonPropertyName("id_receptor")]
        public string IdReceptor { get; set; } = "";

        [System.Text.Json.Serialization.JsonPropertyName("atencion")]
        public short Atencion { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("entrega")]
        public short Entrega { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("responsable")]
        public short Responsable { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("proceso")]
        public short Proceso { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("comentario")]
        public string? Comentario { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("problema")]
        public string? Problema { get; set; }

        [System.Text.Json.Serialization.JsonPropertyName("id_publicacion")]
        public int? IdPublicacion { get; set; }
    }
}
