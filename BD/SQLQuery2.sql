USE [Bookly];
GO

-- 🚨 Desactivar restricciones de clave foránea temporalmente
EXEC sp_MSforeachtable "ALTER TABLE ? NOCHECK CONSTRAINT ALL";
GO

-- 🧹 Borrar datos respetando dependencias
DELETE FROM Resenas;
DELETE FROM Intercambios;
DELETE FROM Publicacion;
DELETE FROM Libros;
DELETE FROM Usuarios;
GO

-- 🔁 Reiniciar los IDENTITY (solo las tablas que lo tienen)
DBCC CHECKIDENT ('Libros', RESEED, 0);
DBCC CHECKIDENT ('Publicacion', RESEED, 0);
DBCC CHECKIDENT ('Intercambios', RESEED, 0);
DBCC CHECKIDENT ('Resenas', RESEED, 0);
GO

-- ✅ Reactivar las restricciones de clave foránea
EXEC sp_MSforeachtable "ALTER TABLE ? WITH CHECK CHECK CONSTRAINT ALL";
GO

-- 📚 Insertar libros (asumiendo que el campo 'ano' es INT)
INSERT INTO Libros (nombre, materia, ano, editorial) VALUES
('Ciencias Naturales 7', 'Ciencias Naturales', 1, 'Kapelusz'),
('Toldot 1', 'Historia Judia', 2, 'ORT'),
('Toldot 2', 'Historia Judia', 3, 'ORT'),
('Toldot 3', 'Historia Judia', 4, 'ORT'),
('Toldot 4', 'Historia Judia', 5, 'ORT'),
('C1 Students Book', 'Ingles', 6, 'Cambridge'),
('Biologia y Ambiente', 'Biologia', 2, 'AZ Editora'),
('Geografia Global', 'Geografia', 4, 'Puerto de Palos'),
('Introduccion a la Programacion', 'Informatica', 3, 'Sigmar'),
('Educacion Civica Hoy', 'Etica', 5, 'Longseller'),
('Ingles Step by Step', 'Ingles', 2, 'Oxford');
GO

-- 👤 Insertar usuarios (asumiendo que el campo 'ano' es INT y 'aboutMe' permite NULL, si no, completa todas las columnas NOT NULL)
INSERT INTO Usuarios (DNI, nombreComp, ano, especialidad, curso, password, aboutMe) VALUES
('45000111', 'Ana Pérez', 1, 'Ciencias Naturales', 'A', 'ana123', 'Estudiante de primer año, amante de la biología.'),
('45000222', 'Bruno Gómez', 2, 'Inglés', 'B', 'bruno123', 'Apasionado por los idiomas y la lectura.'),
('45000333', 'Camila López', 3, 'Historia Judía', 'C', 'camila123', 'Le gusta aprender sobre historia y cultura.'),
('45000444', 'Diego Torres', 4, 'Programación', 'D', 'diego123', 'Fan del código limpio y las bases de datos.'),
('45000555', 'Elena Fernández', 5, 'Geografía', 'E', 'elena123', 'Disfruto los mapas y los viajes.'),
('45000666', 'Federico Díaz', 6, 'Biología', 'A', 'fede123', 'Interesado en las ciencias naturales.'),
('45000777', 'Gabriela Ruiz', 3, 'Ética', 'B', 'gabi123', 'Me gusta debatir y reflexionar sobre valores.'),
('45000888', 'Hernán Castro', 4, 'Historia Judía', 'C', 'hernan123', 'Apasionado por la historia y las tradiciones.'),
('45000999', 'Ivana Martínez', 5, 'Inglés', 'D', 'ivana123', 'Me encantan los libros en inglés y la traducción.'),
('45001010', 'Julián Rodríguez', 6, 'Informática', 'E', 'julian123', 'Desarrollador junior y fan del aprendizaje.');
GO

-- 📝 Insertar publicaciones (revisado: fechas al formato datetime estándar)
INSERT INTO Publicacion (idVendedor, precio, idLibro, status, estadoLibro, fecha, descripcion) VALUES
('45000111', 4800, 1, 1, 'Pocas anotaciones', '2025-10-01', 'Libro de Ciencias Naturales con pocas marcas.'),
('45000111', 5200, 7, 1, 'Como nuevo', '2025-09-25', 'Perfecto estado, casi sin uso.'),
('45000222', 3000, 6, 1, 'Muy anotado', '2025-09-20', 'Subrayado en varias páginas, útil para repaso.'),
('45000222', 5500, 11, 1, 'Como nuevo', '2025-09-30', 'Inglés Step by Step sin uso.'),
('45000333', 2700, 2, 1, 'Muy usado', '2025-08-10', 'Tapa gastada pero contenido completo.'),
('45000333', 3200, 3, 1, 'Pocas anotaciones', '2025-08-15', 'Toldot 2 en buen estado general.'),
('45000444', 4000, 9, 1, 'Como nuevo', '2025-07-12', 'Introducción a la programación en excelente estado.'),
('45000444', 2800, 4, 1, 'Muy anotado', '2025-07-20', 'Toldot 3 con apuntes útiles.'),
('45000555', 3600, 8, 1, 'Pocas anotaciones', '2025-06-05', 'Libro de geografía con subrayados leves.'),
('45000555', 5000, 7, 1, 'Como nuevo', '2025-06-10', 'Biología y ambiente sin uso.'),
('45000666', 4700, 1, 1, 'Muy anotado', '2025-05-18', 'Ciencias Naturales 7 con apuntes de clase.'),
('45000666', 4900, 9, 1, 'Como nuevo', '2025-05-25', 'Manual de programación actualizado.'),
('45000777', 3100, 10, 1, 'Muy usado', '2025-04-12', 'Educación Cívica con marcas en tapa.'),
('45000777', 4500, 8, 1, 'Pocas anotaciones', '2025-04-18', 'Subrayado en pocas páginas.'),
('45000888', 2900, 2, 1, 'Muy anotado', '2025-03-10', 'Toldot 1 con varias notas útiles.'),
('45000888', 3100, 3, 1, 'Pocas anotaciones', '2025-03-12', 'Usado pero bien conservado.'),
('45000888', 3300, 4, 1, 'Como nuevo', '2025-03-15', 'Libro en excelente estado.'),
('45000999', 3800, 6, 1, 'Muy usado', '2025-02-05', 'Inglés con notas y marcas antiguas.'),
('45000999', 5400, 11, 1, 'Como nuevo', '2025-02-10', 'Perfecto para nivel inicial.'),
('45000999', 4200, 1, 1, 'Pocas anotaciones', '2025-02-15', 'Ciencias Naturales en buen estado.'),
('45001010', 5200, 9, 1, 'Como nuevo', '2025-01-20', 'Manual de informática sin uso.'),
('45001010', 2800, 5, 1, 'Muy usado', '2025-01-25', 'Toldot 4 bastante gastado.'),
('45001010', 3500, 8, 1, 'Pocas anotaciones', '2025-01-28', 'Con mapas y gráficos subrayados.'),
('45000111', 4600, 10, 1, 'Pocas anotaciones', '2025-10-10', 'Educación Cívica Hoy, leve subrayado.'),
('45000222', 4100, 7, 1, 'Muy usado', '2025-09-05', 'Biología y Ambiente con uso prolongado.'),
('45000333', 4900, 9, 1, 'Como nuevo', '2025-08-22', 'Manual impecable, incluye guía.'),
('45000444', 3100, 2, 1, 'Muy anotado', '2025-07-29', 'Toldot 1 con apuntes detallados.'),
('45000555', 2700, 3, 1, 'Muy usado', '2025-06-25', 'Cubierta deteriorada, páginas completas.'),
('45000666', 4500, 10, 1, 'Como nuevo', '2025-05-10', 'Edición reciente, sin marcas.'),
('45000777', 3300, 8, 1, 'Pocas anotaciones', '2025-04-30', 'Buen estado general, con mapas.');
GO