using System.Text.Json.Serialization;

namespace Bookly.Models;
public class Publicacion
{
    [JsonPropertyName("id")]
    public int id { get; set; }

    [JsonPropertyName("id_vendedor")]
    public string idVendedor { get; set; }

    [JsonPropertyName("precio")]
    public decimal precio { get; set; }

    [JsonPropertyName("status")]
    public int status { get; set; }

    [JsonPropertyName("estado_libro")]
    public string estadoLibro { get; set; }

    [JsonPropertyName("descripcion")]
    public string descripcion { get; set; }

    [JsonPropertyName("imagen")]
    public byte[] imagen { get; set; }

    [JsonPropertyName("fecha")]
    public DateTime fecha { get; set; }
}
