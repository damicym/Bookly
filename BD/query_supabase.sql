-- hay cosas q cambiar con mayusculas y eso

-- 🧹 Borrar datos (orden correcto)
DELETE FROM "Resenas";
DELETE FROM "Intercambios";
DELETE FROM "Publicacion";
DELETE FROM "Libros";
DELETE FROM "Usuarios";

-- 🔁 Resetear autoincrementales
SELECT setval('"Libros_id_seq"', 1, false);
SELECT setval('"Publicacion_id_seq"', 1, false);
SELECT setval('"Intercambios_id_seq"', 1, false);
SELECT setval('"Resenas_id_seq"', 1, false);

-- 📚 Libros
INSERT INTO "Libros" ("nombre", "materia", "ano", "editorial") VALUES
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

-- 👤 Usuarios
INSERT INTO "Usuarios" ("DNI", "nombreComp", "ano", "especialidad", "curso", "password", "aboutMe") VALUES
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

-- 📝 Publicaciones (ejemplo, podés seguir pegando las demás igual)
INSERT INTO "Publicacion" ("idVendedor", "precio", "idLibro", "status", "estadoLibro", "fecha", "descripcion", "imagen") VALUES
('45000111', 4800, 1, 1, 'Pocas anotaciones', '2025-10-01', 'Libro de Ciencias Naturales con pocas marcas.', null),
('45000111', 5200, 7, 1, 'Como nuevo', '2025-09-25', 'Perfecto estado, casi sin uso.', null),
('45000222', 3000, 6, 1, 'Muy anotado', '2025-09-20', 'Subrayado en varias páginas, útil para repaso.', null);