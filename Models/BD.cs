using System;
using Microsoft.Data.SqlClient;
using Dapper;

namespace Bookly.Models
{
    public static class BD
    {
        private static string _connectionString = @"Server=localhost;DataBase=Bookly;Integrated Security=True;TrustServerCertificate=True;";

        // LOGIN
        public static Usuarios login(string dni, string password)
        {
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                string query = @"SELECT * FROM Usuarios WHERE DNI = @pDNI AND password = @pPassword";
                return connection.QueryFirstOrDefault<Usuarios>(
                    query,
                    new { pDNI = dni, pPassword = password }
                );
            }
        }

        // VERIFICAR SI EL USUARIO YA EXISTE
        public static bool ExisteUsuario(string dni)
        {
            dni = dni ?? "";

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                string query = "SELECT COUNT(1) FROM Usuarios WHERE DNI = @DNI";
                int count = connection.QueryFirst<int>(query, new { DNI = dni });
                return count > 0;
            }
        }

        // REGISTRARSE
        public static void registrarse(Usuarios usuario)
        {
            // Valor por defecto
            usuario.foto ??= "default.jpg";

            // Verificar si el DNI ya existe

            string query = @"INSERT INTO Usuarios (DNI, nombreComp, ano, especialidad, foto, curso, password)
                             VALUES (@DNI, @nombreComp, @ano, @especialidad, @foto, @curso, @password)";

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();

                int filas = connection.Execute(query, new
                {
                    DNI = usuario.DNI,
                    nombreComp = usuario.nombreComp,
                    ano = usuario.ano,
                    especialidad = usuario.especialidad,
                    foto = usuario.foto,
                    curso = usuario.curso,
                    password = usuario.password
                });

                Console.WriteLine($"Usuario registrado correctamente. Filas afectadas: {filas}");
            }
        }
    }
}
