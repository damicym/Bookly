-- Crear tablas

CREATE TABLE IF NOT EXISTS Usuarios (
    DNI VARCHAR(50) PRIMARY KEY,
    nombreComp VARCHAR(50) NOT NULL,
    ano INT NOT NULL,
    especialidad VARCHAR(50),
    curso CHAR(1) NOT NULL,
    password VARCHAR(100) NOT NULL,
    aboutMe VARCHAR(500)
);

CREATE TABLE IF NOT EXISTS Libros (
    id SERIAL PRIMARY KEY,
    nombre VARCHAR(50) NOT NULL,
    materia VARCHAR(50) NOT NULL,
    ano INT NOT NULL,
    editorial VARCHAR(50) NOT NULL
);

CREATE TABLE IF NOT EXISTS Publicacion (
    id SERIAL PRIMARY KEY,
    idVendedor VARCHAR(50) NOT NULL,
    precio NUMERIC(10,2) NOT NULL,
    idLibro INT NOT NULL,
    status INT NOT NULL,
    estadoLibro VARCHAR(50) NOT NULL,
    fecha DATE NOT NULL,
    descripcion VARCHAR(500),
    imagen BYTEA
);

CREATE TABLE IF NOT EXISTS Intercambios (
    id SERIAL PRIMARY KEY,
    idPublicacion INT NOT NULL,
    precioFinal NUMERIC(10,2) NOT NULL,
    idComprador VARCHAR(50) NOT NULL,
    fechaRealizacion DATE NOT NULL
);

CREATE TABLE IF NOT EXISTS Resenas (
    id SERIAL PRIMARY KEY,
    idRedactor VARCHAR(50) NOT NULL,
    idReceptor VARCHAR(50) NOT NULL,
    fecha DATE NOT NULL,
    contenido VARCHAR(500) NOT NULL,
    valoracion FLOAT NOT NULL
);

-- Relaciones

ALTER TABLE Intercambios
ADD CONSTRAINT fk_intercambios_publicacion
FOREIGN KEY (idPublicacion) REFERENCES Publicacion(id);

ALTER TABLE Intercambios
ADD CONSTRAINT fk_intercambios_usuario
FOREIGN KEY (idComprador) REFERENCES Usuarios(DNI);

ALTER TABLE Publicacion
ADD CONSTRAINT fk_publicacion_libro
FOREIGN KEY (idLibro) REFERENCES Libros(id);

ALTER TABLE Publicacion
ADD CONSTRAINT fk_publicacion_usuario
FOREIGN KEY (idVendedor) REFERENCES Usuarios(DNI);

ALTER TABLE Resenas
ADD CONSTRAINT fk_resenas_receptor
FOREIGN KEY (idReceptor) REFERENCES Usuarios(DNI);

ALTER TABLE Resenas
ADD CONSTRAINT fk_resenas_redactor
FOREIGN KEY (idRedactor) REFERENCES Usuarios(DNI);