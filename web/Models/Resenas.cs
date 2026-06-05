using System.Text.Json.Serialization;

namespace Bookly.Models;
public class Resena
{
    [JsonPropertyName("id")]
    public int id { get; set; }

    [JsonPropertyName("id_redactor")]
    public string idRedactor { get; set; }

    [JsonPropertyName("id_receptor")]
    public string IdReceptor { get; set; }

    [JsonPropertyName("fecha")]
    public DateTime fecha { get; set; }

    [JsonPropertyName("contenido")]
    public string contenido { get; set; }

    [JsonPropertyName("valoracion")]
    public float valoracion { get; set; }
}
