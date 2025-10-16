using System;
using Microsoft.Data.SqlClient;
using Dapper;

namespace Bookly.Models
{
    public static class BD
    {
        private static string _connectionString = @"Server=localhost;DataBase=Bookly;Integrated Security=True;TrustServerCertificate=True;";
        public static Usuarios UsuarioLogueado;
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

    }
}