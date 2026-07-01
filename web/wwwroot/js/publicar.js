// ===== PUBLICAR: imagen upload y autocomplete de nombre de libro =====

// ========== Imagen
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded - Inicializando manejo de imagen')
    
    const fileInput = document.getElementById('fileInput')
    
    if (fileInput) {
        console.log('✓ fileInput encontrado, adjuntando listener')
        
        fileInput.addEventListener('change', function(event) {
            console.log('✓ Change event disparado')
            const file = this.files[0]
            
            if (file) {
                console.log('✓ Archivo seleccionado:', file.name)
                
                // 1. Actualizar nombre del archivo
                const fileName = document.getElementById('fileName')
                if (fileName) {
                    fileName.textContent = file.name
                    console.log('✓ Nombre actualizado a:', file.name)
                }
                
                // 2. Actualizar preview de imagen
                const imagenPreview = document.getElementById('imagenPreview')
                if (imagenPreview) {
                    const reader = new FileReader()
                    reader.onload = function(e) {
                        imagenPreview.src = e.target.result
                        console.log('✓ Preview actualizada')
                    }
                    reader.readAsDataURL(file)
                }

                // Cambiar texto del overlay a "Cambiar imagen"
                const overlaySpan = document.querySelector('#imagenPreviewContainer .edit-img-overlay span')
                if (overlaySpan) overlaySpan.textContent = 'Cambiar imagen'
                
                // 3. Actualizar estado
                const estadoImagen = document.getElementById('estadoImagen')
                if (estadoImagen) {
                    estadoImagen.textContent = 'Nueva imagen seleccionada'
                    console.log('✓ Estado actualizado')
                }
                
                // 4. Limpiar flag de eliminación
                const imagenEliminada = document.getElementById('imagenEliminada')
                if (imagenEliminada) {
                    imagenEliminada.value = 'false'
                }
                
                // 5. Mostrar botón eliminar
                const deleteBtn = document.querySelector('.desearBtnForm')
                if (deleteBtn) {
                    deleteBtn.style.display = 'inline-block'
                    console.log('✓ Botón eliminar mostrado')
                }
            }
        })
    } else {
        console.log('✗ fileInput NO encontrado')
    }
})

// Eliminar la imagen actual
function eliminarImagenActual(event) {
    event.preventDefault()
    if (confirm('¿Está seguro de que desea eliminar la imagen actual? Se usará la imagen predeterminada del libro.')) {
        // Marcar que se eliminó la imagen
        const imagenEliminada = document.getElementById('imagenEliminada')
        if (imagenEliminada) {
            imagenEliminada.value = 'true'
        }
        
        // Cambiar la preview a la imagen predeterminada
        const imagenPreview = document.getElementById('imagenPreview')
        if (imagenPreview) {
            imagenPreview.src = '/img/book-placeholder.webp'
        }
        
        // Cambiar el estado
        const estadoImagen = document.getElementById('estadoImagen')
        if (estadoImagen) {
            estadoImagen.textContent = 'Imagen predeterminada'
        }
        
        // Ocultar el botón de eliminar
        const desearBtnForm = document.querySelector('.desearBtnForm')
        if (desearBtnForm) {
            desearBtnForm.style.display = 'none'
        }
        
        // Limpiar el input de archivo
        const fileInput = document.getElementById('fileInput')
        if (fileInput) {
            fileInput.value = ''
        }
        
        // Actualizar el texto del archivo
        const fileName = document.getElementById('fileName')
        if (fileName) {
            fileName.textContent = 'Archivo no encontrado'
        }
    }
}

// ========== Autocomplete v2 — basado en caché local de todos los libros =====
// Flujo:
//   initAutocompleteV2()
//     ├── fetchAllBooks()      → GET /Book/ObtenerTodosLosLibros → llena `libros[]`
//     └── attachChangeEvents() → listeners en #nombre, #editorial, #ano, #materia
//           ├── cualquier cambio → findBook([nombre, editorial, ano, materia])
//           └── cambio en #nombre → getSuggestions(nombre) → renderSuggestions(list)

let libros = [];
let activeIndex = -1;

async function fetchAllBooks() {
    try {
        const resp = await fetch('/Book/ObtenerTodosLosLibros', {
            method: 'GET',
            headers: { 'Accept': 'application/json' }
        });
        if (!resp.ok) throw new Error('Error al obtener libros');
        libros = await resp.json() || [];
    } catch (e) {
        console.warn('fetchAllBooks: no se pudieron cargar los libros', e);
        libros = [];
    }
}

// Rellena TODOS los campos con los datos del libro seleccionado.
// Solo se llama al hacer click o Enter en una sugerencia.
function selectBook(libro) {
    const inputNombre    = document.getElementById('nombre');
    const inputEditorial = document.getElementById('editorial');
    const inputAno       = document.getElementById('ano');
    const inputMateria   = document.getElementById('materia');
    const libroId        = document.getElementById('libroId');

    if (inputNombre)    inputNombre.value    = (libro.nombre    || '').substring(0, 50);
    if (inputEditorial) inputEditorial.value = libro.editorial  || '';
    if (inputAno)       inputAno.value       = libro.ano != null ? libro.ano : '';
    if (inputMateria)   inputMateria.value   = libro.materia    || '';
    if (libroId)        libroId.value        = libro.id;

    setIndicador('existente');
}

// Busca en `libros` un libro que coincida exactamente con los 4 campos.
// Un campo vacío en el input solo hace match si el libro tampoco tiene ese dato.
// Solo actualiza el indicador y libroId — NO toca los inputs.
function findBook([nombre, editorial, ano, materia]) {
    const norm  = s => (s || '').trim().toLowerCase();
    const empty = s => !s || s.trim() === '' || s.trim() === '0';

    const match = libros.find(l => {
        // nombre siempre debe coincidir (es el campo principal)
        if (norm(l.nombre) !== norm(nombre)) return false;

        // editorial: si el input tiene valor debe coincidir; si está vacío el libro tampoco debe tenerlo
        if (!empty(editorial)) {
            if (norm(l.editorial) !== norm(editorial)) return false;
        } else {
            if (!empty(l.editorial)) return false;
        }

        // materia
        if (!empty(materia)) {
            if (norm(l.materia) !== norm(materia)) return false;
        } else {
            if (!empty(l.materia)) return false;
        }

        // ano (select: "0" = sin seleccionar)
        if (!empty(ano)) {
            if (String(l.ano) !== String(ano).trim()) return false;
        } else {
            if (!empty(String(l.ano))) return false;
        }

        return true;
    });

    const libroId = document.getElementById('libroId');

    if (match) {
        if (libroId) libroId.value = match.id;
        setIndicador('existente');
    } else {
        if (libroId) libroId.value = '';
        setIndicador('nuevo');
    }
}

// Filtra `libros` por nombre (contains, case-insensitive) y retorna el array resultante
function getSuggestions(nombre) {
    if (!nombre || nombre.trim().length === 0) return [];
    const q = nombre.trim().toLowerCase();
    return libros
        .filter(l => l.nombre && l.nombre.toLowerCase().includes(q))
        .map(l => l.nombre);
}

function setIndicador(estado) {
    const indicator = document.getElementById('libroIndicator');
    if (!indicator) return;
    if (estado === 'existente') {
        indicator.style.display = 'inline-flex';
        indicator.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="icon icon-tabler icons-tabler-filled icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M20.707 6.293a1 1 0 0 1 0 1.414l-10 10a1 1 0 0 1 -1.414 0l-5 -5a1 1 0 0 1 1.414 -1.414l4.293 4.293l9.293 -9.293a1 1 0 0 1 1.414 0" /></svg> Libro existente encontrado`;
    } else {
        indicator.style.display = 'inline-flex';
        indicator.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-subtitles-edit"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M11.5 19h-5.5a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v3" /><path d="M7 15h5" /><path d="M17 12h-3" /><path d="M11 12h-1" /><path d="M18.42 15.61a2.1 2.1 0 0 1 2.97 2.97l-3.39 3.42h-3v-3l3.42 -3.39" /></svg> Creando nuevo libro`;
    }
}

function renderSuggestions(list) {
    const input     = document.getElementById('nombre');
    const container = document.getElementById('autocomplete-dropdown');
    if (!input || !container) return;

    container.innerHTML = '';

    if (!list || list.length === 0) {
        container.style.display = 'none';
        return;
    }

    list.forEach(nombreLibro => {
        const div = document.createElement('div');
        div.className    = 'autocomplete-item';
        div.textContent  = nombreLibro;

        div.addEventListener('click', () => {
            container.style.display = 'none';
            activeIndex = -1;

            const libro = libros.find(l => (l.nombre || '').toLowerCase() === nombreLibro.toLowerCase());
            if (libro) selectBook(libro);
        });

        container.appendChild(div);
    });

    container.style.display = 'block';
}

function attachChangeEvents() {
    const inputNombre    = document.getElementById('nombre');
    const inputEditorial = document.getElementById('editorial');
    const inputAno       = document.getElementById('ano');
    const inputMateria   = document.getElementById('materia');

    // Crear el contenedor de sugerencias si no existe
    if (inputNombre && !document.getElementById('autocomplete-dropdown')) {
        const wrapper = document.createElement('div');
        wrapper.style.position = 'relative';

        inputNombre.parentNode.insertBefore(wrapper, inputNombre);
        wrapper.appendChild(inputNombre);

        const container = document.createElement('div');
        container.id        = 'autocomplete-dropdown';
        container.className = 'autocomplete-dropdown';
        container.style.display = 'none';
        wrapper.appendChild(container);
    }

    function getValues() {
        return [
            inputNombre    ? inputNombre.value.trim()    : '',
            inputEditorial ? inputEditorial.value.trim() : '',
            inputAno       ? inputAno.value.trim()       : '',
            inputMateria   ? inputMateria.value.trim()   : ''
        ];
    }

    function onFieldChange() {
        findBook(getValues());
    }

    if (inputEditorial) inputEditorial.addEventListener('input', onFieldChange);
    if (inputAno)       inputAno.addEventListener('input', onFieldChange);
    if (inputMateria)   inputMateria.addEventListener('input', onFieldChange);

    if (inputNombre) {
        // Actualizar sugerencias y verificar coincidencia al escribir
        inputNombre.addEventListener('input', function () {
            activeIndex = -1;
            renderSuggestions(getSuggestions(inputNombre.value));
            onFieldChange();
        });

        // Cerrar al hacer click afuera
        document.addEventListener('click', function (e) {
            const container = document.getElementById('autocomplete-dropdown');
            if (container && !inputNombre.contains(e.target) && !container.contains(e.target)) {
                container.style.display = 'none';
                activeIndex = -1;
            }
        });

        // Navegación con teclado: flechas, Enter, Escape
        inputNombre.addEventListener('keydown', function (e) {
            const container = document.getElementById('autocomplete-dropdown');
            if (!container || container.style.display === 'none') return;

            const items = container.querySelectorAll('.autocomplete-item');
            if (!items.length) return;

            if (e.key === 'ArrowDown') {
                e.preventDefault();
                activeIndex = (activeIndex + 1) % items.length;
                updateActive(items);

            } else if (e.key === 'ArrowUp') {
                e.preventDefault();
                activeIndex = (activeIndex - 1 + items.length) % items.length;
                updateActive(items);

            } else if (e.key === 'Enter') {
                if (activeIndex >= 0 && activeIndex < items.length) {
                    e.preventDefault();
                    items[activeIndex].click();
                    activeIndex = -1;
                }

            } else if (e.key === 'Escape') {
                container.style.display = 'none';
                activeIndex = -1;
            }
        });
    }
}

function updateActive(items) {
    items.forEach((el, i) => {
        el.classList.toggle('autocomplete-item--active', i === activeIndex);
        if (i === activeIndex) el.scrollIntoView({ block: 'nearest' });
    });
}

async function initAutocompleteV2() {
    await fetchAllBooks();
    attachChangeEvents();
}

// Arrancar cuando el DOM esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initAutocompleteV2);
} else {
    initAutocompleteV2();
}

// Validación del formulario de publicar (página /Book/Publicar)
(function () {
    var form = document.querySelector('.publicar-form');
    if (!form) return;

    form.addEventListener('submit', function (e) {
        var nombre = document.getElementById('nombre');
        var precio = document.getElementById('precio');

        if (precio && (parseFloat(precio.value) < 1 || parseFloat(precio.value) > 999999)) {
            e.preventDefault();
            if (typeof ocultarPageLoader === 'function') ocultarPageLoader();
            precio.setCustomValidity('El precio debe estar entre $1 y $999.999');
            precio.reportValidity();
            return;
        } else if (precio) {
            precio.setCustomValidity('');
        }

        if (nombre) {
            var val = nombre.value.trim();
            if (val.length < 2) {
                e.preventDefault();
                if (typeof ocultarPageLoader === 'function') ocultarPageLoader();
                nombre.setCustomValidity('El nombre debe tener al menos 2 caracteres');
                nombre.reportValidity();
                return;
            }
            if (val.length > 50) {
                nombre.value = val.substring(0, 50);
            }
            nombre.setCustomValidity('');
        }

        var btn = document.getElementById('publicarSubmitBtn');
        if (typeof setButtonLoading === 'function') setButtonLoading(btn, true);
    });

    ['nombre', 'precio', 'descripcion'].forEach(function (id) {
        var el = document.getElementById(id);
        if (el) el.addEventListener('input', function () { this.setCustomValidity(''); });
    });
})();
