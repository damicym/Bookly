# Controllers:
    - BookController

        Index: Verifica si hay un usuario logueado; si no, redirige al login. Si lo hay, obtiene la lista de libros y los muestra en la vista.

        Publicar (GET): Muestra el formulario para publicar un libro, solo si el usuario está logueado.

        Publicar (POST): Recibe los datos del nuevo libro, los guarda en la base junto con el usuario que lo publicó y redirige al perfil.

        Detalle: Busca un libro por su ID y muestra su información. Si no existe, redirige al inicio.

        Eliminar: Elimina un libro por su ID y redirige al perfil del usuario.

        Edit (GET): Muestra el formulario para editar un libro existente. Si no existe, muestra un mensaje de error y redirige al inicio.

        Edit (POST): Guarda los cambios del libro y de su publicación, luego redirige al perfil del usuario.

    - HomeController

        Index: Muestra la página principal de Bookly.

        Profile: Obtiene el usuario logueado desde la sesión, y si existe, muestra su perfil con las publicaciones asociadas; si no, redirige al login.

        Mensajes: Devuelve la vista de mensajes del usuario.

    - UsersController

        Login (GET): Muestra la vista de inicio de sesión; si ya hay un usuario logueado en sesión, carga su nombre en el ViewBag.

        Login (POST): Valida las credenciales del usuario. Si son correctas, guarda al usuario en la sesión y redirige al inicio; si no, muestra un error.

        isLogged: Verifica si hay un usuario logueado en la sesión y guarda el resultado en el ViewBag.

        Register (GET): Muestra el formulario de registro.

        Register (POST): Crea un nuevo usuario si el DNI no existe aún; de lo contrario, muestra un error.

        Logout: Elimina los datos de sesión del usuario y redirige al login.

# Models:
    - Intercambios
        id
        idPublicacion
        precioFinal
        idComprador
        fechaRealizacion
    - Libros
        id
        nombre
        materia
        ano
        editorial
    - Resenas
        id
        idRedactor
        idReceptor
        fecha
        contenido
        valoracion
    - Usuarios
        DNI
        nombreComp
        ano
        especialidad
        curso
        password
    - Publicacion
        id
        idVendedor
        precio
        estado
        descripcion
        fechaPublicacion
        status
    - También está el model “BD” pero no tiene ninguna propiedad

# Views
    - Book 
        Details
        Publicar
    - Home
        Index
        Profile
        Settings
    - Usuario
        Login
        Register
        Chat
