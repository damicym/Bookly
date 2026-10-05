using System.Text.Json.Serialization;

namespace Bookly.Models;

/// <summary>
/// Notificación persistida en la base de datos.
/// Se distingue de <see cref="Notificacion"/> (que es el DTO de UI, construido en memoria)
/// por tener id, leida, tipo y created_at.
/// </summary>
public class NotificacionDB
{
    [JsonPropertyName("id")]
    public long Id { get; set; }

    /// <summary>DNI del usuario destinatario.</summary>
    [JsonPropertyName("id_usuario")]
    public string IdUsuario { get; set; } = "";

    /// <summary>Categoría: 'resena', 'mensaje', 'sistema', etc.</summary>
    [JsonPropertyName("tipo")]
    public string Tipo { get; set; } = "";

    [JsonPropertyName("titulo")]
    public string Titulo { get; set; } = "";

    [JsonPropertyName("subtitulo")]
    public string? Subtitulo { get; set; }

    /// <summary>URL relativa a la que navega al tocar la notificación.</summary>
    [JsonPropertyName("vinculo")]
    public string? Vinculo { get; set; }

    [JsonPropertyName("leida")]
    public bool Leida { get; set; }

    [JsonPropertyName("created_at")]
    public DateTime? CreatedAt { get; set; }

    /// <summary>
    /// Datos adicionales opcionales. Se deserializa como diccionario string→object
    /// para acceso genérico desde el controller.
    /// </summary>
    [JsonPropertyName("payload")]
    public Dictionary<string, object?>? Payload { get; set; }
}
