INSERT INTO libros (nombre, materia, ano, editorial) VALUES
('Toldot 1', 'Historia Judia', '1ero', 'ORT'),
('Toldot 2', 'Historia Judia', '2ndo', 'ORT'),
('Toldot 3', 'Historia Judia', '3ero', 'ORT'),
('Toldot 4', 'Historia Judia', '4to', 'ORT'),
('C1 Student´s Book', 'Inglés', 'CAE', 'Cambridge'),
('Biología y Ambiente', 'Biología', '1ero', 'AZ Editora'),
('Geografía Global', 'Geografía', '3ero', 'Puerto de Palos'),
('Introducción a la Programación', 'Informática', '2ndo', 'Sigmar'),
('Educación Cívica Hoy', 'Ciudadanía', '4to', 'Longseller'),
('Inglés Step by Step', 'Inglés', 'First', 'Oxford');
INSERT INTO Usuarios (DNI, nombreComp, ano, especialidad, foto, curso, password)
VALUES ('49091985', 'Facundo Lukacher', 3, 'Ingeniería', 'default.png', 'A', '1234');
SELECT * FROM Usuarios 
WHERE DNI = '49091985' AND password = '1234';
