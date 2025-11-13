using System;
using System.Collections.Generic;
using System.Linq;
using Microsoft.Data.SqlClient;
using Dapper;

namespace Bookly.Models
{
    public static class BD
    {
        private static string _connectionString = @"Server=localhost;DataBase=Bookly;Integrated Security=True;TrustServerCertificate=True;";
        public static List<Libros> libros = new List<Libros>();

        // -------------------- USUARIOS --------------------

        public static Usuarios login(string dni, string password)
        {
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                string query = @"SELECT DNI, nombreComp, ano, especialidad, curso, password 
                                 FROM Usuarios 
                                 WHERE DNI = @pDNI AND password = @pPassword";
                Usuarios usuario = connection.QueryFirstOrDefault<Usuarios>(query, new { pDNI = dni, pPassword = password });
                return usuario;
            }
        }

        public static void registrarse(Usuarios usuario)
        {
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                string query = @"INSERT INTO Usuarios (DNI, nombreComp, ano, especialidad, curso, password) 
                                 VALUES (@DNI, @nombreComp, @ano, @especialidad, @curso, @password)";
                connection.Execute(query, new
                {
                    DNI = usuario.DNI,
                    nombreComp = usuario.nombreComp,
                    ano = usuario.ano,
                    especialidad = usuario.especialidad,
                    curso = usuario.curso,
                    password = usuario.password
                });
            }
        }

        // public static void logout()
        // {
        //     UsuarioLogueado = null;
        // }

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
                return null;

            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                string query = @"SELECT DNI, nombreComp, ano, especialidad, curso, password 
                                 FROM Usuarios WHERE DNI = @DNI";
                Usuarios usuario = connection.QueryFirstOrDefault<Usuarios>(query, new { DNI = dni });
                return usuario;
            }
        }

        // -------------------- LIBROS --------------------

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
                string query = @"SELECT id, nombre, materia, ano, editorial 
                                 FROM Libros WHERE id = @pId";
                return connection.QueryFirstOrDefault<Libros>(query, new { pId = id });
            }
        }

        // -------------------- PUBLICACIONES --------------------

        public static void PublicarLibro(Libros libro, string dniVendedor, decimal precio, string estadoLibro, string descripcion, byte[] imagen)
        {
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();

                // Insertar el libro y recuperar su ID
                string insertLibro = @"
                    INSERT INTO Libros (nombre, materia, ano, editorial)
                    VALUES (@nombre, @materia, @ano, @editorial);
                    SELECT CAST(SCOPE_IDENTITY() AS INT);";

                int idLibro = connection.ExecuteScalar<int>(insertLibro, new
                {
                    nombre = libro.nombre,
                    materia = libro.materia,
                    ano = libro.ano,
                    editorial = libro.editorial
                });

                // Insertar la publicación, incluyendo la imagen si está presente
                string insertPublicacion = @"
                    INSERT INTO Publicacion 
                    (idVendedor, precio, idLibro, status, estadoLibro, fecha, descripcion, imagen)
                    VALUES (@idVendedor, @precio, @idLibro, @status, @estadoLibro, @fecha, @descripcion, @imagen);";

                connection.Execute(insertPublicacion, new
                {
                    idVendedor = dniVendedor,
                    precio = precio,
                    idLibro = idLibro,
                    status = 1,
                    estadoLibro = string.IsNullOrEmpty(estadoLibro) ? "Sin especificar" : estadoLibro,
                    fecha = DateTime.Now,
                    descripcion = descripcion,
                    imagen = imagen // puede ser null
                });
            }
        }


        public static void EditarPublicacionCompleta(int idPublicacion, string nombre, string materia, string ano,string editorial, decimal precio, string estadoLibro, string descripcion, byte[] imagen)
        {
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();

                // Obtener el idLibro asociado
                int idLibro = connection.ExecuteScalar<int>(
                    "SELECT idLibro FROM Publicacion WHERE id = @id", new { id = idPublicacion });

                // Actualizar tabla Libros
                string updateLibro = @"
                    UPDATE Libros
                    SET nombre = @nombre,
                        materia = @materia,
                        ano = @ano,
                        editorial = @editorial
                    WHERE id = @idLibro";
                connection.Execute(updateLibro, new { nombre, materia, ano, editorial, idLibro });
                
                string updatePublicacion = @"
                    UPDATE Publicacion
                    SET precio = @precio,
                        estadoLibro = @estadoLibro,
                        descripcion = @descripcion,
                        imagen = @imagen
                    WHERE id = @id";
                connection.Execute(updatePublicacion, new { id = idPublicacion, precio, estadoLibro, descripcion, imagen });
            }
        }

        public static void EditarPublicacion(int idLibro, decimal precio, string estadoLibro, string descripcion)
        {
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                string query = @"UPDATE Publicacion
                                 SET precio = @precio,
                                     estadoLibro = @estadoLibro,
                                     descripcion = @descripcion
                                 WHERE idLibro = @idLibro";
                connection.Execute(query, new { idLibro, precio, estadoLibro, descripcion });
            }
        }

        public static void EliminarLibro(int id)
        {
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                string deleteLibro = "DELETE FROM Libros WHERE id = @pId";
                connection.Execute(deleteLibro, new { pId = id });

                string deletePublicacion = "DELETE FROM Publicacion WHERE idLibro = @pId";
                connection.Execute(deletePublicacion, new { pId = id });

          
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
                return connection.Query<Libros>(query, new { dni }).ToList();
            }
        }

        public static List<Publicacion> ObtenerPublicacionesPorUsuario(string dni)
        {
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                string query = @"
                    SELECT 
                        p.id,
                        p.idVendedor,
                        p.precio,
                        p.status,
                        p.estadoLibro,
                        p.fecha,
                        p.descripcion,
                        l.nombre AS nombreLibro
                    FROM Publicacion p
                    INNER JOIN Libros l ON p.idLibro = l.id
                    WHERE p.idVendedor = @dni";

                return connection.Query<Publicacion>(query, new { dni }).ToList();
            }
        }
        public static List<Libros> ObtenerLibrosPorFiltro(int ano, string materia)
        {
            using (var connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                string query = "SELECT id, nombre, materia, ano, editorial FROM Libros WHERE 1=1";
                if (ano == null)
                    query += " AND ano = @ano";
                if (!string.IsNullOrEmpty(materia))
                    query += " AND materia = @materia";
                return connection.Query<Libros>(query, new { ano, materia }).ToList();
            }
        }
        public static List<PublicacionesCompletas> ObtenerLibrosMostrablesConTope(int tope = -1)
        {
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();

                string query = $@"
                    SELECT {(tope != -1 ? $"TOP {tope}" : "")}
                        p.id,
                        l.nombre,
                        l.materia,
                        l.ano,
                        l.editorial,
                        p.estadoLibro,
                        p.precio,
                        p.descripcion,
                        p.idVendedor,
                        p.fecha,
                        p.status,
                        p.imagen 
                    FROM Publicacion p
                    INNER JOIN Libros l ON p.idLibro = l.id
                    WHERE p.status = 1
                    ORDER BY p.fecha DESC";

                return connection.Query<PublicacionesCompletas>(query).ToList();
            }
        }
        public static List<PublicacionesCompletas> ObtenerRecomendaciones(int ano, string especialidad)
        {
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();

                string query = @"
                    SELECT 
                        p.id,
                        l.nombre,
                        l.materia,
                        l.ano,
                        l.editorial,
                        p.estadoLibro,
                        p.precio,
                        p.descripcion,
                        p.idVendedor,
                        p.fecha,
                        p.status,
                        p.imagen 
                    FROM Publicacion p
                    INNER JOIN Libros l ON p.idLibro = l.id
                    WHERE p.status = 1
                    AND l.ano = @ano
                    AND (@especialidad IS NULL OR l.materia LIKE '%' + @especialidad + '%')
                    ORDER BY p.fecha DESC";

                return connection.Query<PublicacionesCompletas>(query, new { ano, especialidad }).ToList();
            }
        }
        public static List<PublicacionesCompletas> ObtenerRecomendacionesPorAno(int ano)
        {
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();

                string query = @"
                    SELECT 
                        p.id,
                        l.nombre,
                        l.materia,
                        l.ano,
                        l.editorial,
                        p.estadoLibro,
                        p.precio,
                        p.descripcion,
                        p.idVendedor,
                        p.fecha,
                        p.status,
                        p.imagen 
                    FROM Publicacion p
                    INNER JOIN Libros l ON p.idLibro = l.id
                    WHERE l.ano = @ano
                    ORDER BY p.fecha DESC";

                return connection.Query<PublicacionesCompletas>(query, new { ano }).ToList();
            }
        }
        public static List<PublicacionesCompletas> ObtenerPublicacionesCompletasPorUsuario(string dni)
        {
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();

                string query = @"
                    SELECT 
                        p.id,
                        p.idLibro,
                        l.nombre,
                        l.materia,
                        l.ano,
                        l.editorial,
                        p.estadoLibro,
                        p.precio,
                        p.descripcion,
                        p.idVendedor,
                        p.fecha,
                        p.status,
                        p.imagen
                    FROM Publicacion p
                    INNER JOIN Libros l ON p.idLibro = l.id
                    WHERE p.idVendedor = @dni
                    ORDER BY p.fecha DESC";

                return connection.Query<PublicacionesCompletas>(query, new { dni }).ToList();
            }
        }
        public static PublicacionesCompletas ObtenerPublicacionCompletaPorId(int id)
        {
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                string query = @"
                    SELECT 
                        p.id,
                        p.idLibro,
                        l.nombre,
                        l.materia,
                        l.ano,
                        l.editorial,
                        p.estadoLibro,
                        p.precio,
                        p.descripcion,
                        p.idVendedor,
                        p.fecha,
                        p.status,
                        p.imagen 
                    FROM Publicacion p
                    INNER JOIN Libros l ON p.idLibro = l.id
                    WHERE p.id = @pId";

                return connection.QueryFirstOrDefault<PublicacionesCompletas>(query, new { pId = id });
            }
        }
        public static void EliminarPublicacion(int idPublicacion)
        {
            using (SqlConnection connection = new SqlConnection(_connectionString))
            {
                connection.Open();
                
                int idLibro = connection.ExecuteScalar<int>("SELECT idLibro FROM Publicacion WHERE id = @id", new { id = idPublicacion });

                connection.Execute("DELETE FROM Publicacion WHERE id = @id", new { id = idPublicacion });

                int count = connection.ExecuteScalar<int>("SELECT COUNT(*) FROM Publicacion WHERE idLibro = @idLibro", new { idLibro });
                if (count == 0)
                {
                    connection.Execute("DELETE FROM Libros WHERE id = @idLibro", new { idLibro });
                }
            }
        }

    }
}
