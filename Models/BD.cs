using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

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

        // ── helpers ──────────────────────────────────────────────────────────

        private static T Get<T>(string path)
        {
            var response = _http.GetAsync($"{_apiBase}{path}").GetAwaiter().GetResult();
            if (!response.IsSuccessStatusCode) return default;
            var json = response.Content.ReadAsStringAsync().GetAwaiter().GetResult();
            return JsonSerializer.Deserialize<T>(json, _jsonOpts);
        }

        private static HttpResponseMessage Post(string path, object body)
        {
            var json = JsonSerializer.Serialize(body);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            return _http.PostAsync($"{_apiBase}{path}", content).GetAwaiter().GetResult();
        }

        private static HttpResponseMessage Put(string path, object body)
        {
            var json = JsonSerializer.Serialize(body);
            var content = new StringContent(json, Encoding.UTF8, "application/json");
            return _http.PutAsync($"{_apiBase}{path}", content).GetAwaiter().GetResult();
        }

        private static HttpResponseMessage Delete(string path)
        {
            return _http.DeleteAsync($"{_apiBase}{path}").GetAwaiter().GetResult();
        }

        // ── USUARIOS ─────────────────────────────────────────────────────────

        /// <summary>POST /api/usuarios/login</summary>
        public static Usuarios login(string dni, string password)
        {
            var response = Post("/usuarios/login", new { dni, password });
            if (!response.IsSuccessStatusCode) return null;
            var json = response.Content.ReadAsStringAsync().GetAwaiter().GetResult();

            // La API devuelve { success: true, user: { ... } } — extraemos el objeto user
            var wrapper = JsonSerializer.Deserialize<JsonElement>(json, _jsonOpts);
            if (!wrapper.TryGetProperty("user", out var userEl)) return null;
            return JsonSerializer.Deserialize<Usuarios>(userEl.GetRawText(), _jsonOpts);
        }

        /// <summary>PUT /api/usuarios/:dni/about</summary>
        public static void ActualizarAboutMe(string dni, string aboutMe)
        {
            Put($"/usuarios/{Uri.EscapeDataString(dni)}/about", new { aboutMe });
        }

        /// <summary>POST /api/usuarios/register</summary>
        public static void registrarse(Usuarios usuario)
        {
            Post("/usuarios/register", new
            {
                dni       = usuario.DNI,
                nombreComp = usuario.nombreComp,
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
        /// ⚠️  Requiere que el endpoint soporte el parámetro "nombre".
        /// </summary>
        public static Libros ObtenerLibroPorNombre(string nombre)
        {
            if (string.IsNullOrWhiteSpace(nombre)) return null;
            var results = Get<List<Libros>>($"/libros/search?nombre={Uri.EscapeDataString(nombre)}");
            return results?.Count > 0 ? results[0] : null;
        }

        /// <summary>
        /// GET /api/libros/autocomplete?q=texto
        /// ⚠️  Endpoint nuevo: debe devolver List&lt;string&gt; con nombres de libros.
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
        /// ⚠️  Asegurate que tu API soporte "limit" como parámetro opcional.
        /// </summary>
        public static List<PublicacionesCompletas> ObtenerLibrosMostrablesConTope(int tope = -1)
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
        public static void PublicarLibro(Libros libro, string dniVendedor, decimal precio, string estadoLibro, string descripcion, byte[] imagen)
        {
            using var form = new MultipartFormDataContent();
            form.Add(new StringContent(libro.nombre  ?? ""),    "nombre");
            form.Add(new StringContent(libro.materia ?? ""),    "materia");
            form.Add(new StringContent(libro.ano.ToString()),   "ano");
            form.Add(new StringContent(libro.editorial ?? ""),  "editorial");
            form.Add(new StringContent(precio.ToString(System.Globalization.CultureInfo.InvariantCulture)), "precio");
            form.Add(new StringContent(string.IsNullOrEmpty(estadoLibro) ? "Sin especificar" : estadoLibro), "estadoLibro");
            form.Add(new StringContent(descripcion ?? ""),      "descripcion");

            if (imagen != null && imagen.Length > 0)
                form.Add(new ByteArrayContent(imagen), "imagen", "imagen.jpg");

            _http.PostAsync($"{_apiBase}/publicaciones/{Uri.EscapeDataString(dniVendedor)}", form)
                 .GetAwaiter().GetResult();
        }

        /// <summary>PUT /api/publicaciones/:id  (multipart/form-data)</summary>
        public static void EditarPublicacionCompleta(int idPublicacion, string nombre, string materia, string ano, string editorial, decimal precio, string estadoLibro, string descripcion, byte[] imagen)
        {
            using var form = new MultipartFormDataContent();
            form.Add(new StringContent(nombre    ?? ""),  "nombre");
            form.Add(new StringContent(materia   ?? ""),  "materia");
            form.Add(new StringContent(ano       ?? ""),  "ano");
            form.Add(new StringContent(editorial ?? ""),  "editorial");
            form.Add(new StringContent(precio.ToString(System.Globalization.CultureInfo.InvariantCulture)), "precio");
            form.Add(new StringContent(estadoLibro  ?? ""), "estadoLibro");
            form.Add(new StringContent(descripcion  ?? ""), "descripcion");

            if (imagen != null && imagen.Length > 0)
                form.Add(new ByteArrayContent(imagen), "imagen", "imagen.jpg");
            else
                form.Add(new StringContent("true"), "imagenEliminada");

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
            Post("/deseados/add", new { dni, idPublicacion });
        }

        /// <summary>POST /api/deseados/remove</summary>
        public static void EliminarDeseado(string dni, int idPublicacion)
        {
            Post("/deseados/remove", new { dni, idPublicacion });
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

        // ── STATS ────────────────────────────────────────────────────────────

        /// <summary>
        /// GET /api/publicaciones/count
        /// ⚠️  Endpoint nuevo: debe devolver { "count": N }
        /// </summary>
        public static int ContarPublicacionesActivas()
        {
            var result = Get<CountResponse>("/publicaciones/count");
            return result?.count ?? 0;
        }

        /// <summary>
        /// GET /api/usuarios/count
        /// ⚠️  Endpoint nuevo: debe devolver { "count": N }
        /// </summary>
        public static int ContarUsuarios()
        {
            var result = Get<CountResponse>("/usuarios/count");
            return result?.count ?? 0;
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

        // ── tipos auxiliares ──────────────────────────────────────────────────

        private class CountResponse
        {
            public int count { get; set; }
        }
    }
}

// No hay endpoint para estadísticas: ContarPublicacionesActivas() y ContarUsuarios() — necesitás GET /api/publicaciones/count y GET /api/usuarios/count, o un endpoint combinado GET /api/stats.

