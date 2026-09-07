using System;
using System.Text.Json.Serialization;

namespace Bookly.Models
{
    /// <summary>
    /// Representa una entrada en el historial de chats de un usuario.
    /// Devuelto por GET /api/chats/:dniUsuario
    /// </summary>
    public class Chat
    {
        [JsonPropertyName("id")]
        public int id { get; set; }

        [JsonPropertyName("id_contacto")]
        public string idContacto { get; set; }

        [JsonPropertyName("created_at")]
        public DateTime createdAt { get; set; }

        [JsonPropertyName("nombre_comp")]
        public string nombreComp { get; set; }

        [JsonPropertyName("ano")]
        public int? ano { get; set; }

        [JsonPropertyName("especialidad")]
        public string especialidad { get; set; }

        [JsonPropertyName("foto_perfil")]
        public string fotoPerfil { get; set; }
    }
}
