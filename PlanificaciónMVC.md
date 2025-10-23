- Controllers:
    + BookController

    + HomeController
    + UsersController

- Models:
    + Intercambios
        id
        idPublicacion
        precioFinal
        idComprador
        fechaRealizacion
    + Libros
        id
        nombre
        materia
        ano
        editorial
    + Resenas
        id
        idRedactor
        idReceptor
        fecha
        contenido
        valoracion
    + Usuarios
        DNI
        nombreComp
        ano
        especialidad
        curso
        password
    + Publicacion
        id
        idVendedor
        precio
        estado
        descripcion
        fechaPublicacion
        status
    + También está el model “BD” pero no tiene ninguna propiedad

- Views
    + Book 
        Details
        Publicar
    + Home
        Index
        Profile
        Settings
    + Usuario
        Login
        Register
        Chat
