- Controllers:
    + BookController
    + HomeController
    + UsersController

- Models:
    + Intercambios
        *id
        idLibro
        fechaPublicacion
        precio
        idComprador
        idVendedor
        estado
        descripcion
        fechaRealizacion
    + Libros
        id
        nombre
        materia
        ano
        editorial
        imagen
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
        foto
        curso
        password
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
