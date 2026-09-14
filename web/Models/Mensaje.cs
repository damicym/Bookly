using System;
using System.Text.Json.Serialization;

namespace Bookly.Models
{
    /// <summary>
    /// Representa un mensaje individual de una conversación.
    /// Devuelto por GET /api/mensajes/:dniUsuario/:dniContacto
    /// </summary>
    public class Mensaje
    {
        [JsonPropertyName("id")]
        public int id { get; set; }

        [JsonPropertyName("id_emisor")]
        public string idEmisor { get; set; }

        [JsonPropertyName("id_receptor")]
        public string idReceptor { get; set; }

        [JsonPropertyName("contenido")]
        public string contenido { get; set; }

        [JsonPropertyName("fecha_envio")]
        public DateTime fechaEnvio { get; set; }

        [JsonPropertyName("leido")]
        public bool leido { get; set; }
    }
}
