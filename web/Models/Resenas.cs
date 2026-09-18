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

    // ── Promedios calculados por eje ──────────────────────────────────────────

    /// <summary>Promedio del eje atención (p1 + p4 opcionales).</summary>
    [JsonPropertyName("entrega")]
    public short? entrega { get; set; }

    /// <summary>Promedio del eje entrega (p2 + p3 opcionales).</summary>
    [JsonPropertyName("atencion")]
    public short? atencion { get; set; }

    // ── Puntuaciones individuales por pregunta ────────────────────────────────

    /// <summary>P1 — ¿Cómo te trató el vendedor durante la compra? (obligatoria)</summary>
    [JsonPropertyName("p1_atencion")]
    public short? p1Atencion { get; set; }

    /// <summary>P2 — ¿Qué tan conforme estás con el producto entregado? (obligatoria)</summary>
    [JsonPropertyName("p2_entrega")]
    public short? p2Entrega { get; set; }

    /// <summary>P3 — ¿Qué tan responsable fue el vendedor al entregar? (opcional)</summary>
    [JsonPropertyName("p3_entrega")]
    public short? p3Entrega { get; set; }

    /// <summary>P4 — ¿Cómo te resultó el proceso de compra usando Bookly? (opcional)</summary>
    [JsonPropertyName("p4_experiencia")]
    public short? p4Experiencia { get; set; }

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
}
