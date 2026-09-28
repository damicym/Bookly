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
<<<<<<< HEAD
        ///   "id_receptor": string,  -- DNI del vendedor que recibe la reseña
        ///   "atencion":    int,     -- promedio eje atención, 1-5
        ///   "entrega":     int,     -- promedio eje entrega,  1-5
        ///   "comentario":  string?, -- opcional
        ///   "problema":    string?  -- opcional
=======
        ///   "id":            int,     -- id de la fila en resenas (de la notificación)
        ///   "p1_atencion":   int,     -- obligatorio, 1-5
        ///   "p2_entrega":    int,     -- obligatorio, 1-5
        ///   "p3_entrega":    int?,    -- opcional,    1-5
        ///   "p4_experiencia": int?,   -- opcional,    1-5
        ///   "problema":      string   -- opcional
>>>>>>> e150954578717376fec45ea43c6019eee7004881
        /// }
        /// El id_redactor se toma de la sesión activa.
        /// </summary>
        [HttpPost]
        public IActionResult Enviar([FromBody] EnviarResenaDto dto)
        {
            // Requiere sesión activa
            var user = obj.StringToObject<Usuarios>(HttpContext.Session.GetString("usuarioLogueado"));
            if (user == null)
                return Unauthorized(new { success = false, message = "Sesión expirada" });

            Console.WriteLine($"[Resena.Enviar] dto={System.Text.Json.JsonSerializer.Serialize(dto)} user.DNI={user.DNI}");

            // Validación
            if (dto == null
                || string.IsNullOrWhiteSpace(dto.IdReceptor)
                || dto.Atencion    < 1 || dto.Atencion    > 5
                || dto.Entrega     < 1 || dto.Entrega     > 5
                || dto.Responsable < 1 || dto.Responsable > 5
                || dto.Proceso     < 1 || dto.Proceso     > 5)
            {
                Console.WriteLine($"[Resena.Enviar] Validación fallida: dto={dto == null}, receptor='{dto?.IdReceptor}', atencion={dto?.Atencion}, entrega={dto?.Entrega}");
                return BadRequest(new { success = false, message = "Datos inválidos" });
            }

            var ok = BD.EnviarResena(
<<<<<<< HEAD
                idRedactor: user.DNI,
                idReceptor: dto.IdReceptor,
                atencion:   dto.Atencion,
                entrega:    dto.Entrega,
                responsable: dto.Responsable,
                proceso:    dto.Proceso,
                comentario: dto.Comentario ?? "",
                problema:   dto.Problema   ?? ""
=======
                id:            dto.Id,
                p1Atencion:    dto.P1Atencion,
                p2Entrega:     dto.P2Entrega,
                p3Entrega:     dto.P3Entrega,
                p4Experiencia: dto.P4Experiencia,
                atencion:      atencion,
                entrega:       entrega,
                problema:      dto.Problema   ?? ""
>>>>>>> e150954578717376fec45ea43c6019eee7004881
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

        [System.Text.Json.Serialization.JsonPropertyName("problema")]
        public string? Problema { get; set; }
    }
}
