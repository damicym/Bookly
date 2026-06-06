using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;
using Microsoft.AspNetCore.Http;

namespace Bookly.Models
{
    /// <summary>
    /// Capa de acceso a datos: todas las llamadas van a la API REST.
    /// La URL base se lee de la variable de entorno API_URL (ver .env).
    /// </summary>
    public static class BD
    {
        private static readonly string _apiBase =
            Environment.GetEnvironmentVariable("API_URL") ?? "http://localhost:3000/api";

        private static readonly HttpClient _http = new HttpClient();

        private static readonly JsonSerializerOptions _jsonOpts = new JsonSerializerOptions
        {
            PropertyNameCaseInsensitive = true
        };

        private static void AddImageToMultipart(MultipartFormDataContent form, IFormFile imagen)
        {
            if (imagen == null || imagen.Length <= 0) return;

            using var ms = new MemoryStream();
            imagen.CopyTo(ms);
            var bytes = ms.ToArray();
            var fileContent = new ByteArrayContent(bytes);
            fileContent.Headers.ContentType = new System.Net.Http.Headers.MediaTypeHeaderValue(
                string.IsNullOrWhiteSpace(imagen.ContentType) ? "application/octet-stream" : imagen.ContentType
            );
            form.Add(fileContent, "imagen", string.IsNullOrWhiteSpace(imagen.FileName) ? "imagen.webp" : imagen.FileName);
        }

        // ── helpers ──────────────────────────────────────────────────────────

        private static T Get<T>(string path)
        {
            try
            {
                var fullUrl = $"{_apiBase}{path}";
                Console.WriteLine($"[BD.Get] Solicitando: {fullUrl}");
                
                var response = _http.GetAsync(fullUrl).GetAwaiter().GetResult();
                
                Console.WriteLine($"[BD.Get] Status Code: {response.StatusCode}");
                
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = response.Content.ReadAsStringAsync().GetAwaiter().GetResult();
                    Console.WriteLine($"[BD.Get] Error Response: {errorContent}");
                    return default;
                }
                
                var json = response.Content.ReadAsStringAsync().GetAwaiter().GetResult();
                Console.WriteLine($"[BD.Get] Response (primeros 200 chars): {json.Substring(0, Math.Min(200, json.Length))}...");
                
                return JsonSerializer.Deserialize<T>(json, _jsonOpts);
            }
            catch (HttpRequestException ex)
            {
                Console.WriteLine($"[BD.Get] Error de conexión: {ex.Message}");
                return default;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[BD.Get] Error general: {ex.Message}");
                return default;
            }
        }

        private static HttpResponseMessage Post(string path, object body)
        {
            try
            {
                var fullUrl = $"{_apiBase}{path}";
                Console.WriteLine($"[BD.Post] Solicitando: {fullUrl}");
                
                var json = JsonSerializer.Serialize(body);
                Console.WriteLine($"[BD.Post] Body: {json}");
                
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                var response = _http.PostAsync(fullUrl, content).GetAwaiter().GetResult();
                
                Console.WriteLine($"[BD.Post] Status Code: {response.StatusCode}");
                
                if (!response.IsSuccessStatusCode)
                {
                    var errorContent = response.Content.ReadAsStringAsync().GetAwaiter().GetResult();
                    Console.WriteLine($"[BD.Post] Error Response: {errorContent}");
                }
                
                return response;
            }
            catch (HttpRequestException ex)
            {
                Console.WriteLine($"[BD.Post] Error de conexión: {ex.Message}");
                return null;
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[BD.Post] Error general: {ex.Message}");
                return null;
            }
        }

        private static HttpResponseMessage Put(string path, object body)
        {
            try
            {
                var json = JsonSerializer.Serialize(body);
                var content = new StringContent(json, Encoding.UTF8, "application/json");
                return _http.PutAsync($"{_apiBase}{path}", content).GetAwaiter().GetResult();
            }
            catch (HttpRequestException)
            {
                return null;
            }
            catch (Exception)
            {
                return null;
            }
        }

        private static HttpResponseMessage Delete(string path)
        {
            try
            {
                return _http.DeleteAsync($"{_apiBase}{path}").GetAwaiter().GetResult();
            }
            catch (HttpRequestException)
            {
                return null;
            }
            catch (Exception)
            {
                return null;
            }
        }

        // ── USUARIOS ─────────────────────────────────────────────────────────

        /// <summary>POST /api/usuarios/login</summary>
        public static Usuarios login(string dni, string password)
        {
            try
            {
                var response = Post("/usuarios/login", new { dni, password });
                if (response == null || !response.IsSuccessStatusCode) return null;
                var json = response.Content.ReadAsStringAsync().GetAwaiter().GetResult();

                // La API devuelve { success: true, user: { ... } } — extraemos el objeto user
                var wrapper = JsonSerializer.Deserialize<JsonElement>(json, _jsonOpts);
                if (!wrapper.TryGetProperty("user", out var userEl)) return null;
                return JsonSerializer.Deserialize<Usuarios>(userEl.GetRawText(), _jsonOpts);
            }
            catch (Exception)
            {
                return null;
            }
        }

        /// <summary>PUT /api/usuarios/:dni/about</summary>
        public static void ActualizarAboutMe(string dni, string aboutMe)
        {
            Put($"/usuarios/{Uri.EscapeDataString(dni)}/about", new { about_me = aboutMe });
        }

        /// <summary>POST /api/usuarios/register</summary>
        public static void registrarse(Usuarios usuario)
        {
            Post("/usuarios/register", new
            {
                dni       = usuario.DNI,
                nombre_comp = usuario.nombreComp,
                ano       = usuario.ano,
                especialidad = usuario.especialidad,
                curso     = usuario.curso,
                password  = usuario.password
            });
        }

        /// <summary>
        /// Verifica si el usuario existe intentando GET /api/usuarios/:dni.
        /// Devuelve true si la respuesta es 200 OK.
        /// </summary>
        public static bool ExisteUsuario(string dni)
        {
            if (string.IsNullOrWhiteSpace(dni)) return false;
            var response = _http.GetAsync($"{_apiBase}/usuarios/{Uri.EscapeDataString(dni)}")
                                .GetAwaiter().GetResult();
            return response.IsSuccessStatusCode;
        }

        /// <summary>GET /api/usuarios/:dni</summary>
        public static Usuarios ObtenerUsuarioPorDNI(string dni)
        {
            if (string.IsNullOrWhiteSpace(dni)) return null;
            return Get<Usuarios>($"/usuarios/{Uri.EscapeDataString(dni)}");
        }

        // ── LIBROS ───────────────────────────────────────────────────────────

        /// <summary>GET /api/libros</summary>
        public static List<Libros> ObtenerLibros()
        {
            return Get<List<Libros>>("/libros") ?? new List<Libros>();
        }

        /// <summary>GET /api/libros/:id</summary>
        public static Libros ObtenerLibroPorId(int id)
        {
            return Get<Libros>($"/libros/{id}");
        }

        /// <summary>
        /// GET /api/libros/search?nombre=x
        /// </summary>
        public static Libros ObtenerLibroPorNombre(string nombre)
        {
            if (string.IsNullOrWhiteSpace(nombre)) return null;
            var results = Get<List<Libros>>($"/libros/search?nombre={Uri.EscapeDataString(nombre)}");
            return results?.Count > 0 ? results[0] : null;
        }

        /// <summary>
        /// GET /api/libros/autocomplete?q=texto
        /// </summary>
        public static List<string> BuscarNombresLibros(string text)
        {
            if (string.IsNullOrWhiteSpace(text)) return new List<string>();
            return Get<List<string>>($"/libros/autocomplete?q={Uri.EscapeDataString(text)}")
                   ?? new List<string>();
        }

        /// <summary>GET /api/libros/usuario/:dni</summary>
        public static List<Libros> ObtenerLibrosPorUsuario(string dni)
        {
            return Get<List<Libros>>($"/libros/usuario/{Uri.EscapeDataString(dni)}")
                   ?? new List<Libros>();
        }

        /// <summary>
        /// GET /api/libros/search?ano=x&amp;materia=y
        /// </summary>
        public static List<Libros> ObtenerLibrosPorFiltro(int ano, string materia)
        {
            var qs = new StringBuilder("/libros/search?");
            qs.Append($"ano={ano}");
            if (!string.IsNullOrEmpty(materia))
                qs.Append($"&materia={Uri.EscapeDataString(materia)}");
            return Get<List<Libros>>(qs.ToString()) ?? new List<Libros>();
        }

        // ── PUBLICACIONES ────────────────────────────────────────────────────

        /// <summary>
        /// GET /api/publicaciones/feed  (sin límite → devuelve todo)
        /// GET /api/publicaciones/feed?limit=N
        /// </summary>
        public static List<PublicacionesCompletas> ObtenerPublicacionesCompletasConTope(int tope = -1)
        {
            var path = tope > 0
                ? $"/publicaciones/feed?limit={tope}"
                : "/publicaciones/feed";
            return Get<List<PublicacionesCompletas>>(path) ?? new List<PublicacionesCompletas>();
        }

        /// <summary>GET /api/publicaciones/recomendaciones?ano=x&especialidad=y</summary>
        public static List<PublicacionesCompletas> ObtenerRecomendaciones(int ano, string especialidad)
        {
            var path = $"/publicaciones/recomendaciones?ano={ano}";
            if (!string.IsNullOrEmpty(especialidad))
                path += $"&especialidad={Uri.EscapeDataString(especialidad)}";
            return Get<List<PublicacionesCompletas>>(path) ?? new List<PublicacionesCompletas>();
        }

        /// <summary>GET /api/publicaciones/recomendaciones?ano=x</summary>
        public static List<PublicacionesCompletas> ObtenerRecomendacionesPorAno(int ano)
        {
            return Get<List<PublicacionesCompletas>>($"/publicaciones/recomendaciones?ano={ano}")
                   ?? new List<PublicacionesCompletas>();
        }

        /// <summary>GET /api/publicaciones/usuario/:dni</summary>
        public static List<PublicacionesCompletas> ObtenerPublicacionesCompletasPorUsuario(string dni)
        {
            return Get<List<PublicacionesCompletas>>($"/publicaciones/usuario/{Uri.EscapeDataString(dni)}")
                   ?? new List<PublicacionesCompletas>();
        }

        /// <summary>GET /api/publicaciones/:id</summary>
        public static PublicacionesCompletas ObtenerPublicacionCompletaPorId(int id)
        {
            return Get<PublicacionesCompletas>($"/publicaciones/{id}");
        }

        /// <summary>
        /// POST /api/publicaciones/:id_vendedor  (multipart/form-data)
        /// </summary>
        public static void PublicarLibro(Libros libro, string dniVendedor, decimal precio, string estadoLibro, string descripcion, IFormFile imagen)
        {
            using var form = new MultipartFormDataContent();
            var libroPayload = JsonSerializer.Serialize(new
            {
                id = libro?.id,
                nombre = libro?.nombre,
                materia = libro?.materia,
                ano = libro?.ano,
                editorial = libro?.editorial
            });
            form.Add(new StringContent(libroPayload, Encoding.UTF8, "application/json"), "libro");
            form.Add(new StringContent(precio.ToString(System.Globalization.CultureInfo.InvariantCulture)), "precio");
            form.Add(new StringContent(string.IsNullOrEmpty(estadoLibro) ? "Sin especificar" : estadoLibro), "estado_libro");
            form.Add(new StringContent(descripcion ?? ""),      "descripcion");

            AddImageToMultipart(form, imagen);

            _http.PostAsync($"{_apiBase}/publicaciones/{Uri.EscapeDataString(dniVendedor)}", form)
                 .GetAwaiter().GetResult();
        }

        /// <summary>PUT /api/publicaciones/:id  (multipart/form-data)</summary>
        public static void EditarPublicacionCompleta(int idPublicacion, string nombre, string materia, string ano, string editorial, decimal precio, string estadoLibro, string descripcion, IFormFile imagen)
        {
            using var form = new MultipartFormDataContent();
            int? anoParsed = null;
            if (int.TryParse(ano, out var anoInt)) anoParsed = anoInt;

            var libroPayload = JsonSerializer.Serialize(new
            {
                nombre,
                materia,
                ano = anoParsed,
                editorial
            });
            form.Add(new StringContent(libroPayload, Encoding.UTF8, "application/json"), "libro");
            form.Add(new StringContent(precio.ToString(System.Globalization.CultureInfo.InvariantCulture)), "precio");
            form.Add(new StringContent(estadoLibro  ?? ""), "estado_libro");
            form.Add(new StringContent(descripcion  ?? ""), "descripcion");

            AddImageToMultipart(form, imagen);

            // PUT con multipart requiere un HttpRequestMessage manual
            var request = new HttpRequestMessage(HttpMethod.Put, $"{_apiBase}/publicaciones/{idPublicacion}")
            {
                Content = form
            };
            _http.SendAsync(request).GetAwaiter().GetResult();
        }

        /// <summary>DELETE /api/publicaciones/:id</summary>
        public static void EliminarPublicacion(int idPublicacion)
        {
            Delete($"/publicaciones/{idPublicacion}");
        }

        /// <summary>DELETE /api/libros/:id</summary>
        public static void EliminarLibro(int id)
        {
            Delete($"/libros/{id}");
        }

        // ── DESEADOS ─────────────────────────────────────────────────────────

        /// <summary>POST /api/deseados/add</summary>
        public static void AgregarDeseado(string dni, int idPublicacion)
        {
            Post("/deseados/add", new { dni, id_publicacion = idPublicacion });
        }

        /// <summary>POST /api/deseados/remove</summary>
        public static void EliminarDeseado(string dni, int idPublicacion)
        {
            Post("/deseados/remove", new { dni, id_publicacion = idPublicacion });
        }

        /// <summary>GET /api/deseados/:dni/ids</summary>
        public static List<int> ObtenerDeseadosPorUsuario(string dni)
        {
            if (string.IsNullOrWhiteSpace(dni)) return new List<int>();
            return Get<List<int>>($"/deseados/{Uri.EscapeDataString(dni)}/ids")
                   ?? new List<int>();
        }

        /// <summary>GET /api/deseados/:dni/favoritos</summary>
        public static List<PublicacionesCompletas> ObtenerPublicacionesFavoritasPorUsuario(string dni)
        {
            if (string.IsNullOrWhiteSpace(dni)) return new List<PublicacionesCompletas>();
            return Get<List<PublicacionesCompletas>>($"/deseados/{Uri.EscapeDataString(dni)}/favoritos")
                   ?? new List<PublicacionesCompletas>();
        }

        // ── MÉTODOS NO MIGRADOS ───────────────────────────────────────────────

        /// <summary>
        /// ActualizarImagenes ya no aplica en la arquitectura API.
        /// Se deja como no-op para no romper la llamada en Program.cs.
        /// Podés eliminar la llamada en Program.cs con seguridad.
        /// </summary>
        public static void ActualizarImagenes(string contentRootPath)
        {
            // No-op: la migración de imágenes debe hacerse directamente en la API/BD.
        }
    }
}
