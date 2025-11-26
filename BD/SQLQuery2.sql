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
('Ingles Step by Step', 'Ingles', 2, 'Oxford'),
('El Eternauta', 'Lengua', 2, 'Planeta Comic'),
('Historia', 'Historia', 2, 'Kapelusz'),
('Libro de Hebreo 1', 'Hebreo', 2, 'ORT'),
('El extraño caso del Dr. Jekyll y el Sr. Hyde', 'Lengua', 2, 'La estación'),
('Fuentes del Judaismo 3', 'Educación Judía', 2, 'ORT');


GO

-- 👤 Insertar usuarios (asumiendo que el campo 'ano' es INT y 'aboutMe' permite NULL, si no, completa todas las columnas NOT NULL)
INSERT INTO Usuarios (DNI, nombreComp, ano, especialidad, curso, password, aboutMe) VALUES
('45000111', 'Ana Pérez', 1, null, 'A', 'ana123', 'Estudiante de primer año, amante de la biología.'),
('45000222', 'Bruno Gómez', 2, null, 'B', 'bruno123', 'Apasionado por los idiomas y la lectura.'),
('45000333', 'Camila López', 3, null, 'C', 'camila123', 'Le gusta aprender sobre historia y cultura.'),
('45000444', 'Diego Torres', 4, 'Informática', 'D', 'diego123', 'Fan del código limpio y las bases de datos.'),
('45000555', 'Elena Fernández', 5, 'Química', 'E', 'elena123', 'Disfruto los mapas y los viajes.'),
('45000666', 'Federico Díaz', 6, 'Química', 'A', 'fede123', 'Interesado en las ciencias naturales.'),
('45000777', 'Gabriela Ruiz', 3, null, 'B', 'gabi123', 'Me gusta debatir y reflexionar sobre valores.'),
('45000888', 'Hernán Castro', 4, 'Gestión', 'C', 'hernan123', 'Apasionado por la historia y las tradiciones.'),
('45000999', 'Ivana Martínez', 5, 'Construcciones', 'D', 'ivana123', 'Me encantan los libros en inglés y la traducción.'),
('45001010', 'Julián Rodríguez', 6, 'Informática', 'E', 'julian123', 'Desarrollador junior y fan del aprendizaje.'),
('50542543', 'Mario Finker', 4, 'Mecatrónica', 'A', 'mario2222','Me gusta la robótica'),
('51334453', 'Juan Binker', 3, NULL, 'J', 'juanBinker33', 'Soy de Boca Juniors.');
GO

-- 📝 Insertar publicaciones (revisado: fechas al formato datetime estándar)
INSERT INTO Publicacion (idVendedor, precio, idLibro, status, estadoLibro, fecha, descripcion, imagen) VALUES
('45000111', 4800, 1, 1, 'Pocas anotaciones', '2025-10-01', 'Libro de Ciencias Naturales con pocas marcas.', null),
('45000111', 5200, 7, 1, 'Como nuevo', '2025-09-25', 'Perfecto estado, casi sin uso.', null),
('45000222', 3000, 6, 1, 'Muy anotado', '2025-09-20', 'Subrayado en varias páginas, útil para repaso.', null),
('45000222', 5500, 11, 1, 'Como nuevo', '2025-09-30', 'Inglés Step by Step sin uso.', null),
('45000333', 2700, 2, 1, 'Muy usado', '2025-08-10', 'Tapa gastada pero contenido completo.', null),
('45000333', 3200, 3, 1, 'Pocas anotaciones', '2025-08-15', 'Toldot 2 en buen estado general.', null),
('45000444', 4000, 9, 1, 'Como nuevo', '2025-07-12', 'Introducción a la programación en excelente estado.', null),
('45000444', 2800, 4, 1, 'Muy anotado', '2025-07-20', 'Toldot 3 con apuntes útiles.', null),
('45000555', 3600, 8, 1, 'Pocas anotaciones', '2025-06-05', 'Libro de geografía con subrayados leves.', null),
('45000555', 5000, 7, 1, 'Como nuevo', '2025-06-10', 'Biología y ambiente sin uso.', null),
('45000666', 4700, 1, 1, 'Muy anotado', '2025-05-18', 'Ciencias Naturales 7 con apuntes de clase.', null),
('45000666', 4900, 9, 1, 'Como nuevo', '2025-05-25', 'Manual de programación actualizado.', null),
('45000777', 3100, 10, 1, 'Muy usado', '2025-04-12', 'Educación Cívica con marcas en tapa.', null),
('45000777', 4500, 8, 1, 'Pocas anotaciones', '2025-04-18', 'Subrayado en pocas páginas.', null),
('45000888', 2900, 2, 1, 'Muy anotado', '2025-03-10', 'Toldot 1 con varias notas útiles.', null),
('45000888', 3100, 3, 1, 'Pocas anotaciones', '2025-03-12', 'Usado pero bien conservado.', null),
('45000888', 3300, 4, 1, 'Como nuevo', '2025-03-15', 'Libro en excelente estado.', null),
('45000999', 3800, 6, 1, 'Muy usado', '2025-02-05', 'Inglés con notas y marcas antiguas.', null),
('45000999', 5400, 11, 1, 'Como nuevo', '2025-02-10', 'Perfecto para nivel inicial.', null),
('45000999', 4200, 1, 1, 'Pocas anotaciones', '2025-02-15', 'Ciencias Naturales en buen estado.', null),
('45001010', 5200, 9, 1, 'Como nuevo', '2025-01-20', 'Manual de informática sin uso.', null),
('45001010', 2800, 5, 1, 'Muy usado', '2025-01-25', 'Toldot 4 bastante gastado.', null),
('45001010', 3500, 8, 1, 'Pocas anotaciones', '2025-01-28', 'Con mapas y gráficos subrayados.', null),
('45000111', 4600, 10, 1, 'Pocas anotaciones', '2025-10-10', 'Educación Cívica Hoy, leve subrayado.', null),
('45000222', 4100, 7, 1, 'Muy usado', '2025-09-05', 'Biología y Ambiente con uso prolongado.', null),
('45000333', 4900, 9, 1, 'Como nuevo', '2025-08-22', 'Manual impecable, incluye guía.', null),
('45000444', 3100, 2, 1, 'Muy anotado', '2025-07-29', 'Toldot 1 con apuntes detallados.', null),
('45000555', 2700, 3, 1, 'Muy usado', '2025-06-25', 'Cubierta deteriorada, páginas completas.', null),
('45000666', 4500, 10, 1, 'Como nuevo', '2025-05-10', 'Edición reciente, sin marcas.', null),
('45000777', 3300, 8, 1, 'Pocas anotaciones', '2025-04-30', 'Buen estado general, con mapas.', null),
('50542543', 4300, 11, 1, 'Muy anotado', '2025-03-29', 'Anotaciones útiles, buen estado general...', null),
('50542543', 7300, 12, 1, 'Pocas anotaciones', '2025-03-27', 'Anotaciones leves en pocas páginas, perfecto estado.', null),
('50542543', 8300, 13, 1, 'Pocas anotaciones', '2025-03-29', 'Tiene algunas anotaciones, aún así está en muy buen estado.', null),
('50542543', 5300, 14, 1, 'Muy anotado', '2025-03-29', 'Anotaciones útiles, buen estado general...', null),
('50542543', 9500, 15, 1, 'Como nuevo', '2025-04-02', 'Ninguna anotación, perfecto estado.', null);
GO


