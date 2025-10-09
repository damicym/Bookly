using System;
using System.Collections.Generic;
using System.Data;
using System.Data.SqlClient;
using Microsoft.Data.SqlClient;
using Dapper;

namespace TP06.Models
{
    public static class BD
    {
        private static string _connectionString = @"Server=localhost;DataBase=Bookly;Integrated Security=True;TrustServerCertificate=True;";

        public static Usuarios login(string mail, string password)
        {
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                string query = @"SELECT * FROM Usuarios WHERE mail = @pMail AND password = @pPassword";
                return connection.QueryFirstOrDefault<Usuarios>(
                    query,
                    new { pMail = mail, pPassword = password }
                );
            }
        }

        public static void registrarse(Usuarios usuario)
        {
            string query = @"INSERT INTO Usuarios (nombre, apellido, foto, username, ultLogin, password) 
                            VALUES (@nombre, @apellido, @foto, @username, @ultLogin, @password)";

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Execute(query, 
                new{
                    nombre = usuario.nombre,
                    apellido = usuario.apellido,
                    foto = usuario.foto,
                    username = usuario.username,
                    ultLogin = usuario.ultLogin,
                    password = usuario.password
                });
            }
        }
                
        public static List<Tareas> devolverTareas(int IdU)
        {
            string query = @"SELECT * FROM Tareas WHERE IdU = @pIdU";

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                return connection.Query<Tareas>(query, new { pIdU = IdU }).AsList();
            }
        }

        public static Tareas devolverTarea(int idtarea)
        {
            string query = @"SELECT * FROM Tareas WHERE Id = @pId";

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                return connection.QueryFirstOrDefault<Tareas>(query, new { pId = idtarea });
            }
        }

        public static void modificarTarea(Tareas tarea)
        {
            string query = @"UPDATE Tareas SET titulo = @titulo, descripcion = @descripcion, fecha = @fecha, finalizado = @finalizado, IdU = @IdU WHERE Id = @Id"; 
                                                        
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Execute(query, new
                {
                    Id = tarea.Id,
                    titulo = tarea.titulo,
                    descripcion = tarea.descripcion,
                    fecha = tarea.fecha,
                    finalizado = tarea.finalizado,
                    IdU = tarea.IdU
                });
            }
        }

        public static void eliminarTarea(int idTarea)
        {
            string query = @"DELETE FROM Tareas WHERE Id = @pId";

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Execute(query, new { pId = idTarea });
            }
        }
        public static void crearTarea(Tareas tarea)
        {
            string query = @"INSERT INTO Tareas (titulo, descripcion, fecha, finalizado, IdU)
                            VALUES (@titulo, @descripcion, @fecha, @finalizado, @IdU)";

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Execute(query, new
                {
                    titulo = tarea.titulo,
                    descripcion = tarea.descripcion,
                    fecha = tarea.fecha,
                    finalizado = tarea.finalizado,
                    IdU = tarea.IdU
                });
            }
        }

        public static void finalizarTarea(int idtarea)
        {
            string query = @"UPDATE Tareas SET finalizado = 1 WHERE Id = @pId";

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Execute(query, new { pId = idtarea });
            }
        }
        public static List<Tareas> obtenerTareasPorUsuario(int idUsuario)
        {
            List<Tareas> lista = new List<Tareas>();

            string query = @"SELECT * FROM Tareas WHERE IdU = @IdU";

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                lista = connection.Query<Tareas>(query, new { IdU = idUsuario }).ToList();
            }

            return lista;
        }
        public static Tareas obtenerTareaPorId(int id)
        {
            Tareas tarea = null;

            string query = @"SELECT * FROM Tareas WHERE Id = @Id";

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                tarea = connection.QueryFirstOrDefault<Tareas>(query, new { Id = id });
            }

            return tarea;
        }

        public static void actLogin(int IdU)
        {
            string query = @"UPDATE Usuarios SET ultLogin = GETDATE() WHERE Id = @pId";

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Execute(query, new { pId = IdU });
            }
        }
        public static bool UsernameExiste(string username)
        {
            string query = "SELECT COUNT(*) FROM Usuarios WHERE username = @username";

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                int count = connection.ExecuteScalar<int>(query, new { username = username });
                return count > 0;
            }
        }
        public static void ActualizarFoto(int idUsuario, string nuevaUrl)
        {
            string query = "UPDATE Usuarios SET foto = @foto WHERE Id = @id";

            using (SqlConnection con = new SqlConnection(_connectionString))
            {
                con.Execute(query, new { foto = nuevaUrl, id = idUsuario });
            }
        }
    }
}