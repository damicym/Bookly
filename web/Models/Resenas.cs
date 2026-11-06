using System.Text.Json.Serialization;

namespace Bookly.Models;

public class Resena
{
    [JsonPropertyName("id")]
    public int id { get; set; }

    /// <summary>DNI del usuario que escribió la reseña (el comprador).</summary>
    [JsonPropertyName("id_redactor")]
    public string idRedactor { get; set; }

    /// <summary>DNI del vendedor que recibe la reseña.</summary>
    [JsonPropertyName("id_receptor")]
    public string idReceptor { get; set; }

    /// <summary>Fecha en que se completó la reseña.</summary>
    [JsonPropertyName("fecha_respuesta")]
    public DateTime? fechaRespuesta { get; set; }

    // ── Puntuaciones de la encuesta (1-5) ────────────────────────────────────

    /// <summary>¿Cómo te trató el vendedor durante la compra?</summary>
    [JsonPropertyName("atencion")]
    public short? atencion { get; set; }

    /// <summary>Promedio: ¿qué tan conforme estás con el producto + responsabilidad de entrega?</summary>
    [JsonPropertyName("entrega")]
    public short? entrega { get; set; }

    /// <summary>¿Qué tan responsable fue el vendedor a la hora de entregar el producto?</summary>
    [JsonPropertyName("responsable")]
    public short? responsable { get; set; }

    /// <summary>¿Cómo te resultó el proceso de compra utilizando Bookly?</summary>
    [JsonPropertyName("proceso")]
    public short? proceso { get; set; }

    // ── Textos libres ─────────────────────────────────────────────────────────

    [JsonPropertyName("comentario")]
    public string? comentario { get; set; }

    [JsonPropertyName("problema")]
    public string? problema { get; set; }

    // ── Metadatos ─────────────────────────────────────────────────────────────

    [JsonPropertyName("created_at")]
    public DateTime? createdAt { get; set; }

    /// <summary>Nombre completo del receptor, enriquecido por la API (join con usuarios).</summary>
    [JsonPropertyName("nombre_receptor")]
    public string? nombreReceptor { get; set; }

    /// <summary>ID de la publicación asociada a esta reseña.</summary>
    [JsonPropertyName("id_publicacion")]
    public int? idPublicacion { get; set; }

    /// <summary>Nombre del libro de la publicación, enriquecido por la API.</summary>
    [JsonPropertyName("nombre_libro")]
    public string? nombreLibro { get; set; }
}
