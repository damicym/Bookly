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

// ========== Autocomplete de nombre de libro
// pone un dropdown con sugerencias de nombres mientras el usuario escribe
// hace llamadas a /Book/AutocompleteNombres?q=... para fijarse coincidencias
// - Inserta un contenedor con las sugerencias debajo del input #nombre

(function(){
    function initAutocomplete() {
        const input = document.getElementById('nombre');
        if (!input) return;

        // Contenedor para las sugerencias
        const container = document.createElement('div');
        container.className = 'autocomplete-dropdown';
        container.style.display = 'none';
        // Posicionaremos el contenedor justo debajo del input
        input.parentNode.style.position = 'relative';
        input.parentNode.appendChild(container);

        // Realiza la petición al servidor 
        let lastSuggestions = [];
        let fetchingApi = false;

        function setSubmitDisabled(disabled) {
            const btn = document.getElementById('publicarSubmitBtn');
            if (!btn) return;
            btn.disabled = disabled;
        }

        async function fetchSuggestions(text) {
            if (!text || text.length < 1) {
                container.style.display = 'none';
                container.innerHTML = '';
                setIndicador('nuevo');
                return;
            }
            try {
                const url = `/Book/AutocompleteNombres?q=${encodeURIComponent(text)}`;
                setSubmitDisabled(true);
                const resp = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
                if (!resp.ok) throw new Error('Error en petición');
                const data = await resp.json();
                lastSuggestions = data || [];
                renderSuggestions(lastSuggestions);
                const current = input.value.trim();
                const libroId = document.getElementById('libroId');
                const match = lastSuggestions.some(s => (s || '').toLowerCase() === current.toLowerCase());
                if (!match) {
                    if (libroId) libroId.value = '';
                    setIndicador('nuevo');
                }
            } catch (e) {
                container.style.display = 'none';
                container.innerHTML = '';
            } finally {
                setSubmitDisabled(false);
            }
        }

        function setIndicador(estado) {
            const indicator = document.getElementById('libroIndicator');
            if (!indicator) return;
            if (estado === 'existente') {
                indicator.style.display = 'inline-flex';
                indicator.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="icon icon-tabler icons-tabler-filled icon-tabler-check"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M20.707 6.293a1 1 0 0 1 0 1.414l-10 10a1 1 0 0 1 -1.414 0l-5 -5a1 1 0 0 1 1.414 -1.414l4.293 4.293l9.293 -9.293a1 1 0 0 1 1.414 0" /></svg> Libro existente seleccionado`;
            } else {
                indicator.style.display = 'inline-flex';
                indicator.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-subtitles-edit"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M11.5 19h-5.5a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12a3 3 0 0 1 3 3v3" /><path d="M7 15h5" /><path d="M17 12h-3" /><path d="M11 12h-1" /><path d="M18.42 15.61a2.1 2.1 0 0 1 2.97 2.97l-3.39 3.42h-3v-3l3.42 -3.39" /></svg> Creando nuevo libro`;
            }
        }

        function renderSuggestions(list) {
            container.innerHTML = '';
            if (!list || list.length === 0) { container.style.display = 'none'; return; }
            list.forEach(item => {
                const div = document.createElement('div');
                div.className = 'autocomplete-item';
                div.textContent = item;
                div.addEventListener('click', async () => {
                    input.value = item.substring(0, 50); // respetar maxlength
                    container.style.display = 'none';
                    // Solicitar datos completos del libro y autocompletar campos
                    try {
                        setSubmitDisabled(true);
                        const resp = await fetch(`/Book/ObtenerLibroPorNombre?nombre=${encodeURIComponent(item)}`);
                        if (!resp.ok) throw new Error('err');
                        const data = await resp.json();
                        if (data && data.found) {
                            const editorial = document.getElementById('editorial');
                            const materia = document.getElementById('materia');
                            const ano = document.getElementById('ano');
                            const libroId = document.getElementById('libroId');
                            if (editorial) editorial.value = data.editorial || '';
                            if (materia) materia.value = data.materia || '';
                            if (ano) ano.value = data.ano !== undefined ? data.ano : ano.value;
                            if (libroId) libroId.value = data.id || '';
                            setIndicador('existente');
                        } else {
                            const libroId = document.getElementById('libroId');
                            if (libroId) libroId.value = '';
                            setIndicador('nuevo');
                        }
                    } catch (e) {
                        // silencioso
                    } finally {
                        setSubmitDisabled(false);
                    }
                });
                container.appendChild(div);
            });
            // Ajustar ancho y posicion con respecto al input
            container.style.width = input.offsetWidth + 'px';
            container.style.top = (input.offsetTop + input.offsetHeight) + 'px';
            container.style.left = input.offsetLeft + 'px';
            container.style.display = 'block';
        }

        // Petición directa en cada cambio (sin debounce)
        input.addEventListener('input', function(e) {
            const libroId = document.getElementById('libroId');
            if (libroId) libroId.value = '';
            setIndicador('nuevo');
            fetchSuggestions(e.target.value.trim());
        });

        // Cerrar al hacer click afuera
        document.addEventListener('click', function(e) {
            if (!input.contains(e.target) && !container.contains(e.target)) {
                container.style.display = 'none';
            }
        });

        // Cerrar con tecla esc
        input.addEventListener('keydown', function(e) {
            if (e.key === 'Escape') {
                container.style.display = 'none';
            }
        });
    }

    // Inicializar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initAutocomplete);
    } else {
        initAutocomplete();
    }
})();
