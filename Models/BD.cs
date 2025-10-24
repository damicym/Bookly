using System;
using Microsoft.Data.SqlClient;
using Dapper;

namespace Bookly.Models
{
    public static class BD
    {
        private static string _connectionString = @"Server=localhost;DataBase=Bookly;Integrated Security=True;TrustServerCertificate=True;";
        public static Usuarios UsuarioLogueado;
        public static List<Libros> libros = new List<Libros>();
        public static Usuarios login(string dni, string password)
        {
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                string query = "SELECT DNI, nombreComp, ano, especialidad, curso, password FROM Usuarios WHERE DNI = @pDNI AND password = @pPassword";
                Usuarios usuario = connection.QueryFirstOrDefault<Usuarios>(query, new { pDNI = dni, pPassword = password });
                UsuarioLogueado = usuario;
                return usuario;
            }
        }
        public static void registrarse(Usuarios usuario)
        {

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                string query = "INSERT INTO Usuarios (DNI, nombreComp, ano, especialidad, curso, password) VALUES (@DNI, @nombreComp, @ano, @especialidad, @curso, @password)";
                connection.Execute(query, new
                {
                    DNI = usuario.DNI,
                    nombreComp = usuario.nombreComp,
                    ano = usuario.ano,
                    especialidad = usuario.especialidad,
                    curso = usuario.curso == '\0' ? (string)null : usuario.curso.ToString(),
                    password = usuario.password
                });
            }
        }
        public static void logout()
        {
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                string query = "DELETE FROM Usuarios WHERE DNI = @DNI";
                connection.Execute(query, new { DNI = UsuarioLogueado.DNI });
            }
            UsuarioLogueado = null;
        }
        public static bool ExisteUsuario(string dni)
        {
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                string query = "SELECT COUNT(1) FROM Usuarios WHERE DNI = @DNI";
                int count = connection.ExecuteScalar<int>(query, new { DNI = dni ?? "" });
                return count > 0;
            }
        }



        //Libros
        public static Usuarios ObtenerUsuarioPorDNI(string dni)
        {
            if (string.IsNullOrWhiteSpace(dni))
            {
                return null;
            }
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                string query = "SELECT DNI, nombreComp, ano, especialidad, foto, curso, password FROM Usuarios WHERE DNI = @DNI";
                Usuarios usuario = connection.QueryFirstOrDefault<Usuarios>(query, new { Dni = dni });
                return usuario;
            }
        }
        public static List<Libros> ObtenerLibros()
        {
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                string query = "SELECT id, nombre, materia, ano, editorial FROM Libros";
                return connection.Query<Libros>(query).ToList();
            }
        }

        public static Libros ObtenerLibroPorId(int id)
        {
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                string query = "SELECT id, nombre, materia, ano, editorial FROM Libros WHERE id = @pId";
                return connection.QueryFirstOrDefault<Libros>(query, new { pId = id });
            }
        }

        public static void PublicarLibro(Libros libro, string dniVendedor, decimal precio, string estadoLibro, string descripcion)
        {
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();

                string insertLibro = @"INSERT INTO Libros (nombre, materia, ano, editorial)
                                    VALUES (@nombre, @materia, @ano, @editorial);
                                    SELECT CAST(SCOPE_IDENTITY() AS INT);";

                int idLibro = connection.ExecuteScalar<int>(insertLibro, new
                {
                    nombre = libro.nombre,
                    materia = libro.materia,
                    ano = libro.ano,
                    editorial = libro.editorial
                });

                string insertPublicacion = @"INSERT INTO Publicacion (id, idVendedor, precio, idLibro, status, estadoLibro, fecha, descripcion)
                                            VALUES (@id, @idVendedor, @precio, @idLibro, @status, @estadoLibro, @fecha, @descripcion)";

                connection.Execute(insertPublicacion, new
                {
                    id = idLibro,
                    idVendedor = dniVendedor,
                    precio = precio,
                    idLibro = idLibro,
                    status = 1, 
                    estadoLibro = estadoLibro,
                    fecha = DateTime.Now,
                    descripcion = descripcion
                });
            }
        }

        public static void EliminarLibro(int id)
        {
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                string query = "DELETE FROM Libros WHERE id = @pId";
                connection.Execute(query, new { pId = id });
            }
        }
        public static void EditarLibro(Libros libro)
        {
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                string query = @"UPDATE Libros 
                                SET nombre = @nombre, 
                                    materia = @materia, 
                                    ano = @ano, 
                                    editorial = @editorial
                                WHERE id = @id";
                connection.Execute(query, new
                {
                    id = libro.id,
                    nombre = libro.nombre,
                    materia = libro.materia,
                    ano = libro.ano,
                    editorial = libro.editorial
                });
            }
        }
        public static List<Libros> ObtenerLibrosPorUsuario(string dni)
        {
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                string query = @"SELECT l.id, l.nombre, l.materia, l.ano, l.editorial
                                FROM Libros l
                                JOIN Publicacion p ON l.id = p.idLibro
                                WHERE p.idVendedor = @dni";
                List<Libros> libros = connection.Query<Libros>(query, new { dni }).ToList();
                return libros;
            }
        }
        public static List<Publicacion> ObtenerPublicacionesPorUsuario(string dni)
        {
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                string query = @"SELECT id, idVendedor, precio, status, estadoLibro, fecha, descripcion
                                FROM Publicacion
                                WHERE idVendedor = @dni";
                return connection.Query<Publicacion>(query, new { dni }).ToList();
            }
        }
    }
}