using System;
using Microsoft.Data.SqlClient;
using Dapper;

namespace Bookly.Models
{
    public static class BD
    {
        private static string _connectionString = @"Server=localhost;DataBase=Bookly;Integrated Security=True;TrustServerCertificate=True;";
        public static Usuarios UsuarioLogueado;
        public static List<Libros> libros;
        public static Usuarios login(string dni, string password)
        {
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                string query = "SELECT DNI, nombreComp, ano, especialidad, foto, curso, password FROM Usuarios WHERE DNI = @pDNI AND password = @pPassword";
                Usuarios usuario = connection.QueryFirstOrDefault<Usuarios>(query, new { pDNI = dni, pPassword = password });
                UsuarioLogueado = usuario;
                return usuario;
            }
        }
        public static void registrarse(Usuarios usuario)
        {
            if (usuario.foto == null)
            {
                usuario.foto = "img/default.jpg";
            }
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                string query = "INSERT INTO Usuarios (DNI, nombreComp, ano, especialidad, foto, curso, password) VALUES (@DNI, @nombreComp, @ano, @especialidad, @foto, @curso, @password)";
                connection.Execute(query, new
                {
                    DNI = usuario.DNI,
                    nombreComp = usuario.nombreComp,
                    ano = usuario.ano,
                    especialidad = usuario.especialidad,
                    foto = usuario.foto,
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

        public static void PublicarLibro(Libros libro)
        {
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                string query = "INSERT INTO Libros (nombre, materia, ano, editorial) VALUES (@nombre, @materia, @ano, @editorial)";
                connection.Execute(query, new
                {
                    nombre = libro.nombre,
                    materia = libro.materia,
                    ano = libro.ano,
                    editorial = libro.editorial,
                    dniUsuario = UsuarioLogueado.DNI
                });
                libros.Add(libro);
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
                string query = @"SELECT id, nombre, materia, ano, editorial 
                                FROM Libros 
                                WHERE dniUsuario = @dni";
                List<Libros> libros = connection.Query<Libros>(query, new { dni }).ToList();
                return libros;
            }
        }
    }
}