USE [Bookly];
GO

BEGIN TRY
    BEGIN TRANSACTION;

    -- 🧹 Borrar datos (orden correcto por FK)
    DELETE FROM [dbo].[Deseados];
    DELETE FROM [dbo].[Resenas];
    DELETE FROM [dbo].[Intercambios];
    DELETE FROM [dbo].[Publicacion];
    DELETE FROM [dbo].[Libros];
    DELETE FROM [dbo].[Usuarios];

    -- 🔁 Resetear autoincrementales
    DBCC CHECKIDENT ('Libros',      RESEED, 0);
    DBCC CHECKIDENT ('Publicacion', RESEED, 0);
    DBCC CHECKIDENT ('Intercambios',RESEED, 0);
    DBCC CHECKIDENT ('Resenas',     RESEED, 0);

    -- 📚 Libros (IDs quedarán 1-16 en orden de inserción)
    INSERT INTO [dbo].[Libros] ([nombre], [materia], [ano], [editorial]) VALUES
    ('Ciencias Naturales 7',                         'Ciencias Naturales', 1, 'Kapelusz'),   -- id 1
    ('Toldot 1',                                     'Historia Judia',     2, 'ORT'),         -- id 2
    ('Toldot 2',                                     'Historia Judia',     3, 'ORT'),         -- id 3
    ('Toldot 3',                                     'Historia Judia',     4, 'ORT'),         -- id 4
    ('Toldot 4',                                     'Historia Judia',     5, 'ORT'),         -- id 5
    ('C1 Students Book',                             'Ingles',             6, 'Cambridge'),   -- id 6
    ('Biologia y Ambiente',                          'Biologia',           2, 'AZ Editora'),  -- id 7
    ('Geografia Global',                             'Geografia',          4, 'Puerto de Palos'), -- id 8
    ('Introduccion a la Programacion',               'Informatica',        3, 'Sigmar'),      -- id 9
    ('Educacion Civica Hoy',                         'Etica',              5, 'Longseller'),  -- id 10
    ('Ingles Step by Step',                          'Ingles',             2, 'Oxford'),      -- id 11
    ('El Eternauta',                                 'Lengua',             2, 'Planeta Comic'), -- id 12
    ('Historia',                                     'Historia',           2, 'Kapelusz'),    -- id 13
    ('Libro de Hebreo 1',                            'Hebreo',             2, 'ORT'),         -- id 14
    ('El extraño caso del Dr. Jekyll y el Sr. Hyde', 'Lengua',             2, 'La estación'), -- id 15
    ('Fuentes del Judaismo 3',                       'Educación Judía',    2, 'ORT');         -- id 16

    -- 👤 Usuarios
    INSERT INTO [dbo].[Usuarios] ([DNI], [nombreComp], [ano], [especialidad], [curso], [password], [aboutMe]) VALUES
    ('45000111', 'Ana Pérez',         1, NULL,             'A', 'ana123',       'Estudiante de primer año, amante de la biología.'),
    ('45000222', 'Bruno Gómez',       2, NULL,             'B', 'bruno123',     'Apasionado por los idiomas y la lectura.'),
    ('45000333', 'Camila López',      3, NULL,             'C', 'camila123',    'Le gusta aprender sobre historia y cultura.'),
    ('45000444', 'Diego Torres',      4, 'Informática',    'D', 'diego123',     'Fan del código limpio y las bases de datos.'),
    ('45000555', 'Elena Fernández',   5, 'Química',        'E', 'elena123',     'Disfruto los mapas y los viajes.'),
    ('45000666', 'Federico Díaz',     6, 'Química',        'A', 'fede123',      'Interesado en las ciencias naturales.'),
    ('45000777', 'Gabriela Ruiz',     3, NULL,             'B', 'gabi123',      'Me gusta debatir y reflexionar sobre valores.'),
    ('45000888', 'Hernán Castro',     4, 'Gestión',        'C', 'hernan123',    'Apasionado por la historia y las tradiciones.'),
    ('45000999', 'Ivana Martínez',    5, 'Construcciones', 'D', 'ivana123',     'Me encantan los libros en inglés y la traducción.'),
    ('45001010', 'Julián Rodríguez',  6, 'Informática',    'E', 'julian123',    'Desarrollador junior y fan del aprendizaje.'),
    ('50542543', 'Mario Finker',      4, 'Mecatrónica',    'A', 'mario2222',    'Me gusta la robótica'),
    ('51334453', 'Juan Binker',       3, NULL,             'J', 'juanBinker33', 'Soy de Boca Juniors.');

    -- 📝 Publicaciones (imagen = NULL, usar SeedPublicaciones.cs para insertar con imágenes)
    INSERT INTO [dbo].[Publicacion]
        ([idVendedor], [precio], [idLibro], [status], [estadoLibro], [fecha], [descripcion], [imagen])
    VALUES
    ('45000111', 4800,  1, 1, 'Pocas anotaciones', '2025-10-01', 'Libro de Ciencias Naturales con pocas marcas.',                NULL),
    ('45000111', 5200,  7, 1, 'Como nuevo',         '2025-09-25', 'Perfecto estado, casi sin uso.',                               NULL),
    ('45000222', 3000,  6, 1, 'Muy anotado',        '2025-09-20', 'Subrayado en varias páginas, útil para repaso.',               NULL),
    ('45000222', 5500, 11, 1, 'Como nuevo',         '2025-09-30', 'Inglés Step by Step sin uso.',                                 NULL),
    ('45000333', 2700,  2, 1, 'Muy usado',          '2025-08-10', 'Tapa gastada pero contenido completo.',                        NULL),
    ('45000333', 3200,  3, 1, 'Pocas anotaciones',  '2025-08-15', 'Toldot 2 en buen estado general.',                            NULL),
    ('45000444', 4000,  9, 1, 'Como nuevo',         '2025-07-12', 'Introducción a la programación en excelente estado.',          NULL),
    ('45000444', 2800,  4, 1, 'Muy anotado',        '2025-07-20', 'Toldot 3 con apuntes útiles.',                                NULL),
    ('45000555', 3600,  8, 1, 'Pocas anotaciones',  '2025-06-05', 'Libro de geografía con subrayados leves.',                    NULL),
    ('45000555', 5000,  7, 1, 'Como nuevo',         '2025-06-10', 'Biología y ambiente sin uso.',                                 NULL),
    ('45000666', 4700,  1, 1, 'Muy anotado',        '2025-05-18', 'Ciencias Naturales 7 con apuntes de clase.',                  NULL),
    ('45000666', 4900,  9, 1, 'Como nuevo',         '2025-05-25', 'Manual de programación actualizado.',                          NULL),
    ('45000777', 3100, 10, 1, 'Muy usado',          '2025-04-12', 'Educación Cívica con marcas en tapa.',                        NULL),
    ('45000777', 4500,  8, 1, 'Pocas anotaciones',  '2025-04-18', 'Subrayado en pocas páginas.',                                 NULL),
    ('45000888', 2900,  2, 1, 'Muy anotado',        '2025-03-10', 'Toldot 1 con varias notas útiles.',                           NULL),
    ('45000888', 3100,  3, 1, 'Pocas anotaciones',  '2025-03-12', 'Usado pero bien conservado.',                                 NULL),
    ('45000888', 3300,  4, 1, 'Como nuevo',         '2025-03-15', 'Libro en excelente estado.',                                   NULL),
    ('45000999', 3800,  6, 1, 'Muy usado',          '2025-02-05', 'Inglés con notas y marcas antiguas.',                         NULL),
    ('45000999', 5400, 11, 1, 'Como nuevo',         '2025-02-10', 'Perfecto para nivel inicial.',                                 NULL),
    ('45000999', 4200,  1, 1, 'Pocas anotaciones',  '2025-02-15', 'Ciencias Naturales en buen estado.',                          NULL),
    ('45001010', 5200,  9, 1, 'Como nuevo',         '2025-01-20', 'Manual de informática sin uso.',                               NULL),
    ('45001010', 2800,  5, 1, 'Muy usado',          '2025-01-25', 'Toldot 4 bastante gastado.',                                   NULL),
    ('45001010', 3500,  8, 1, 'Pocas anotaciones',  '2025-01-28', 'Con mapas y gráficos subrayados.',                            NULL),
    ('45000111', 4600, 10, 1, 'Pocas anotaciones',  '2025-10-10', 'Educación Cívica Hoy, leve subrayado.',                       NULL),
    ('45000222', 4100,  7, 1, 'Muy usado',          '2025-09-05', 'Biología y Ambiente con uso prolongado.',                     NULL),
    ('45000333', 4900,  9, 1, 'Como nuevo',         '2025-08-22', 'Manual impecable, incluye guía.',                              NULL),
    ('45000444', 3100,  2, 1, 'Muy anotado',        '2025-07-29', 'Toldot 1 con apuntes detallados.',                            NULL),
    ('45000555', 2700,  3, 1, 'Muy usado',          '2025-06-25', 'Cubierta deteriorada, páginas completas.',                    NULL),
    ('45000666', 4500, 10, 1, 'Como nuevo',         '2025-05-10', 'Edición reciente, sin marcas.',                                NULL),
    ('45000777', 3300,  8, 1, 'Pocas anotaciones',  '2025-04-30', 'Buen estado general, con mapas.',                             NULL),
    ('50542543', 4300, 11, 1, 'Muy anotado',        '2025-03-29', 'Anotaciones útiles, buen estado general.',                    NULL),
    ('50542543', 7300, 12, 1, 'Pocas anotaciones',  '2025-03-27', 'Anotaciones leves en pocas páginas, perfecto estado.',        NULL),
    ('50542543', 8300, 13, 1, 'Pocas anotaciones',  '2025-03-29', 'Tiene algunas anotaciones, aún así está en muy buen estado.', NULL),
    ('50542543', 5300, 14, 1, 'Muy anotado',        '2025-03-29', 'Anotaciones útiles, buen estado general.',                    NULL),
    ('50542543', 9500, 15, 1, 'Como nuevo',         '2025-04-02', 'Ninguna anotación, perfecto estado.',                          NULL);

    COMMIT TRANSACTION;
    PRINT '✅ Seed completado correctamente.';

END TRY
BEGIN CATCH
    ROLLBACK TRANSACTION;
    PRINT '❌ Error en línea ' + CAST(ERROR_LINE() AS VARCHAR) + ': ' + ERROR_MESSAGE();
END CATCH
