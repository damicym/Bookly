using System.Text.Json.Serialization;

namespace Bookly.Models;
public class PublicacionesCompletas
{
    [JsonPropertyName("id")]
    public int id { get; set; }

    [JsonPropertyName("id_libro")]
    public int idLibro { get; set; }

    [JsonPropertyName("nombre")]
    public string nombre { get; set; }

    [JsonPropertyName("materia")]
    public string? materia { get; set; }

    [JsonPropertyName("ano")]
    public int? ano { get; set; }

    [JsonPropertyName("editorial")]
    public string? editorial { get; set; }

    [JsonPropertyName("estado_libro")]
    public string estadoLibro { get; set; }

    [JsonPropertyName("precio")]
    public double precio { get; set; }

    [JsonPropertyName("descripcion")]
    public string descripcion { get; set; }

    [JsonPropertyName("id_vendedor")]
    public string idVendedor { get; set; }

    [JsonPropertyName("fecha")]
    public DateTime fecha { get; set; }

    [JsonPropertyName("status")]
    public int status { get; set; }

    [JsonPropertyName("imagen")]
    public string imagen { get; set; }

    // Campos calculados en C#, no vienen de la API
    public bool esDeseado { get; set; }
    public bool esMasBarato { get; set; }
}
