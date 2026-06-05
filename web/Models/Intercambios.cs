using System.Text.Json.Serialization;

namespace Bookly.Models;
public class Intercambio
{
    [JsonPropertyName("id")]
    public int id { get; set; }

    [JsonPropertyName("id_publicacion")]
    public int idPublicacion { get; set; }

    [JsonPropertyName("precio_final")]
    public decimal precioFinal { get; set; }

    [JsonPropertyName("id_comprador")]
    public string idComprador { get; set; }

    [JsonPropertyName("fecha_realizacion")]
    public DateTime fechaRealizacion { get; set; }
}
