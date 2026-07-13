using System.Text.Json.Serialization;

namespace Bookly.Models;

public class Resena
{
    [JsonPropertyName("id")]
    public int id { get; set; }

    /// <summary>DNI del usuario que debe escribir la reseña (el comprador).</summary>
    [JsonPropertyName("id_redactor")]
    public string idRedactor { get; set; }

    /// <summary>DNI del vendedor que recibe la reseña.</summary>
    [JsonPropertyName("id_receptor")]
    public string idReceptor { get; set; }

    /// <summary>Fecha en que se completó la reseña. Null = todavía pendiente.</summary>
    [JsonPropertyName("fecha_respuesta")]
    public DateTime? fechaRespuesta { get; set; }

    /// <summary>Puntuación de entrega (int2).</summary>
    [JsonPropertyName("entrega")]
    public short? entrega { get; set; }

    /// <summary>Puntuación de atención (int2).</summary>
    [JsonPropertyName("atencion")]
    public short? atencion { get; set; }

    [JsonPropertyName("created_at")]
    public DateTime? createdAt { get; set; }

    /// <summary>Nombre completo del receptor, enriquecido por la API (join con usuarios).</summary>
    [JsonPropertyName("nombre_receptor")]
    public string? nombreReceptor { get; set; }
}
