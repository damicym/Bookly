using System.Text.Json.Serialization;

namespace Bookly.Models
{
    public class Usuarios
    {
        [JsonPropertyName("dni")]
        public string DNI { get; set; }

        [JsonPropertyName("nombre_comp")]
        public string nombreComp { get; set; }

        [JsonPropertyName("ano")]
        public int? ano { get; set; }

        [JsonPropertyName("especialidad")]
        public string especialidad { get; set; }

        [JsonPropertyName("curso")]
        public string curso { get; set; }

        [JsonPropertyName("password")]
        public string password { get; set; }

        [JsonPropertyName("about_me")]
        public string aboutMe { get; set; }

        [JsonPropertyName("foto_perfil")]
        public string fotoPerfil { get; set; }
    }
}
