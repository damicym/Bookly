using System.Text.Json.Serialization;

namespace Bookly.Models;
public class Libros
{
    [JsonPropertyName("id")]
    public int id { get; set; }

    [JsonPropertyName("nombre")]
    public string nombre { get; set; }

    [JsonPropertyName("materia")]
    public string? materia { get; set; }

    [JsonPropertyName("ano")]
    public int? ano { get; set; }

    [JsonPropertyName("editorial")]
    public string? editorial { get; set; }
}
