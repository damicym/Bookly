console.log("entra a js")
// const input = document.getElementById("about")
// input.style.width = input.scrollWidth + "px"
const aboutMeContainer = document.getElementById("aboutMeContainer")
const btnEditAboutMe = document.getElementById("btnEditAboutMe")
const aboutMe = document.getElementById("aboutMe")
const searchInput = document.getElementById("searchInput")

// Funciones helper
function pasarAnoATexto(ano) {
    switch(ano) {
        case 1: return "7mo"
        case 2: return "1ero"
        case 3: return "2ndo"
        case 4: return "3ero"
        case 5: return "4to"
        case 6: return "5to"
        default: return "Desconocido"
    }
}

function toUpperPrimeraLetra(texto) {
    if (!texto) return texto
    return texto.split(' ').map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()).join(' ')
}

function limpiarPrecio(valor) {
    return (valor ?? "").toString().replace(/\D/g, "")
}

function formatearMiles(valor) {
    const soloDigitos = limpiarPrecio(valor)
    if (!soloDigitos) return ""
    return soloDigitos.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

function getColor(estado) {
    switch(estado) {
        case "Como nuevo": return "var(--secondary2)"
        case "Pocas anotaciones": return "var(--accent)"
        case "Con algunas anotaciones": return "var(--accent)"
        case "Muy anotado": return "var(--red)"
        case "Muy usado": return "var(--red)"
        default: return "white"
    }
}
const container = document.getElementById("resultados")
if (searchInput && container) {
    realizarBusqueda(searchInput.value.trim())
    searchInput.focus()
    const len = searchInput.value ? searchInput.value.length : 0
    if (typeof searchInput.setSelectionRange === 'function') {
        searchInput.setSelectionRange(len, len)
    } else {
        searchInput.selectionStart = searchInput.selectionEnd = len
    }
}

async function realizarBusqueda(query) {
    if (query !== null && query !== undefined) {
        try{
            const materia = document.getElementById("filtroMateria")?.value?.trim() ?? ""
            const ano = document.getElementById("filtroAno")?.value?.trim() ?? ""
            const estado = document.getElementById("filtroEstado")?.value?.trim() ?? ""
            const editorial = document.getElementById("filtroEditoriales")?.value?.trim() ?? ""
            const precioMin = limpiarPrecio(document.getElementById("filtroPrecioMin")?.value?.trim() ?? "")
            const precioMax = limpiarPrecio(document.getElementById("filtroPrecioMax")?.value?.trim() ?? "")

            const params = new URLSearchParams({
                query: query ?? "",
                materia,
                ano,
                estado,
                editorial,
                precioMin,
                precioMax
            })

            const res = await fetch(`/Home/Buscar?${params.toString()}`)
            const data = await res.json()
            if (container) {
                let html = ''
                const token = document.querySelector('input[name="__RequestVerificationToken"]')
                const tokenInput = token ? `<input type="hidden" name="__RequestVerificationToken" value="${token.value}">` : ''
                if (data.publicaciones && data.publicaciones.length > 0) {
                    data.publicaciones.forEach(libro => {
                        const imgSrc = libro.imagen ? `data:image/webpbase64,${libro.imagen}` : '/img/book-placeholder.webp'
                        html += `
                            <div class="libro" onclick="window.location.href='/Book/Detalle?id=${libro.id}&idVendedor=${libro.idVendedor}'">
                                <div class="libroImgContainer">
                                    <img src="${imgSrc}" alt="imagen del libro" />
                                    <section class="libroActionsContainer">
                                        <form class="desearBtnForm hoverVerde" action="/Book/Desear" method="post" style="display:inline">
                                            ${tokenInput}
                                            <input type="hidden" name="id" value="${libro.id}" />
                                            <button type="submit" onclick="event.stopPropagation()">
                                                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-bookmark"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M18 7v14l-6 -4l-6 4v-14a4 4 0 0 1 4 -4h4a4 4 0 0 1 4 4z" /></svg>
                                            </button>
                                        </form>
                                    </section>
                                </div>
                                <div class="nombreYMateriaContainer">
                                    <h1>${toUpperPrimeraLetra(libro.nombre)}</h1>
                                    <h2>${toUpperPrimeraLetra(libro.materia)}</h2>
                                </div>
                                <h3>$${libro.precio}</h3>
                                <div class="pillContainer">
                                    <span class="pill" style="background-color:${getColor(libro.estadoLibro)}">${libro.estadoLibro}</span>
                                    <span class="pill">${pasarAnoATexto(libro.ano)}</span>
                                </div>
                            </div>
                        `
                    })
                } else {
                    html = '<div class="no-result"><p>No se encontraron resultados.</p></div>'
                }
                container.innerHTML = html
            }
        } catch (error) {
            console.error("Error al buscar:", error)
        }
    } else {
        // Limpia resultados si query está vacío
        const container = document.getElementById("resultados")
        if (container) container.innerHTML = '<div class="no-result"><p>No se encontraron resultados.</p></div>'
    }
}

let debounceTimer
if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        clearTimeout(debounceTimer)
        const query = e.target.value.trim()
        if (!window.location.href.includes("/Home/Catalogo")) {
            window.location.href = `/Home/Catalogo?query=${encodeURIComponent(query)}`
        }
        debounceTimer = setTimeout(async () => {
            realizarBusqueda(query)
        }, 300)  // Espera 300ms
    })
}

const filtrosBusqueda = [
    document.getElementById("filtroMateria"),
    document.getElementById("filtroAno"),
    document.getElementById("filtroEstado"),
    document.getElementById("filtroEditoriales"),
    document.getElementById("filtroPrecioMin"),
    document.getElementById("filtroPrecioMax")
].filter(Boolean)

const precioInputs = [
    document.getElementById("filtroPrecioMin"),
    document.getElementById("filtroPrecioMax")
].filter(Boolean)

precioInputs.forEach((inputPrecio) => {
    inputPrecio.addEventListener("input", (e) => {
        e.target.value = formatearMiles(e.target.value)
    })
    inputPrecio.value = formatearMiles(inputPrecio.value)
})

if (container && filtrosBusqueda.length > 0) {
    filtrosBusqueda.forEach((filtro) => {
        const ejecutar = () => {
            clearTimeout(debounceTimer)
            const queryActual = searchInput?.value?.trim() ?? ""
            debounceTimer = setTimeout(() => {
                realizarBusqueda(queryActual)
            }, 300)
        }

        filtro.addEventListener("change", ejecutar)
        filtro.addEventListener("input", ejecutar)
    })
}

// Especialidad deshabilitado
const anoSelect = document.getElementById('ano')
const especialidadSelect = document.getElementById('especialidad')
if(anoSelect){
    anoSelect.addEventListener('change', () => {
      const valor = parseInt(anoSelect.value)
   
   
      // Deshabilita si el año es menor a 3 o no es un número
      const deshabilitado = isNaN(valor) || valor < 4
      especialidadSelect.disabled = deshabilitado
   
   
      // Si está habilitado, que sea requerido si no, quita el atributo
      if (deshabilitado) {
        especialidadSelect.removeAttribute('required')
      } else {
        especialidadSelect.setAttribute('required', '')
      }
    })
}


let aboutMeInput = aboutMe ? aboutMe.textContent : ""


function updateAboutMeInput(){
    aboutMeInput = document.getElementById("aboutMeTextarea").value
}


if(btnEditAboutMe){
    btnEditAboutMe.addEventListener("click", editarAboutMe)
}


function editarAboutMe() {
    const tokenEl = aboutMeContainer ? aboutMeContainer.querySelector('input[name="__RequestVerificationToken"]') : null
    const tokenInputHtml = tokenEl ? `<input type="hidden" name="__RequestVerificationToken" value="${tokenEl.value}">` : ''

    aboutMeContainer.innerHTML = `
        ${tokenInputHtml}
        <textarea name="aboutMe" onchange="updateAboutMeInput()" id="aboutMeTextarea" maxlength="200" placeholder="Escribí algo sobre vos..." class="aboutMeInput" rows="3">${aboutMeInput}</textarea>
        <button class="mainBtn" type="submit" style="width: min-content">Guardar</button>
    `

    setTimeout(() => {
        const ta = document.getElementById('aboutMeTextarea')
        if (ta) {
            ta.focus()
            const len = ta.value ? ta.value.length : 0
            if (typeof ta.setSelectionRange === 'function') {
                ta.setSelectionRange(len, len)
            } else {
                ta.selectionStart = ta.selectionEnd = len
            }
        }
    }, 0)
}


//Solo letras en curso
const inputCurso = document.getElementById("curso")
if(inputCurso){
    inputCurso.addEventListener("input", function () {
        this.value = this.value.replace(/[^a-zA-Z]/g, '')
        this.value = this.value.toUpperCase()
    })
}


// ========== imagen
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

const svgDeseado = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="icon icon-tabler icons-tabler-filled icon-tabler-heart"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M6.979 3.074a6 6 0 0 1 4.988 1.425l.037 .033l.034 -.03a6 6 0 0 1 4.733 -1.44l.246 .036a6 6 0 0 1 3.364 10.008l-.18 .185l-.048 .041l-7.45 7.379a1 1 0 0 1 -1.313 .082l-.094 -.082l-7.493 -7.422a6 6 0 0 1 3.176 -10.215z" /></svg>'
const svgNoDeseado = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-heart"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" /></svg>'
// // Intercepta envíos de formularios con clase .desearBtnForm y los envía en segundo plano
// document.addEventListener('submit', async function(e) {
//     const form = e.target
//     e.preventDefault()
//     e.stopPropagation()
//     // if (!form || !form.classList || !form.classList.contains('desearBtnForm')) return
//     if (!form || form.id !== 'desearBtnForm') return

//     const action = '/Book/Desear'
//     const formData = new FormData(form)
//     const tokenEl = form.querySelector('input[name="__RequestVerificationToken"]')
//     const token = tokenEl ? tokenEl.value : null

//     try {
//         const headers = token ? { 'RequestVerificationToken': token } : {}
//         const res = await fetch(action, {
//             method: 'POST',
//             body: formData,
//             headers
//         })
//         const data = await res.json().catch(() => null)
//         if (data && data.success) {
//             // feedback visual opcional
//             const btn = form.querySelector('button')
//             if (btn) {
//                 btn.classList.add('deseado')
//                 btn.innerHTML = svgDeseado
//             } 

//         } else {
//             console.error('Error al marcar como deseado', data)
//         }
//     } catch (err) {
//         console.error('Error al enviar petición Desear:', err)
//     }
// })

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
        async function fetchSuggestions(text) {
            if (!text || text.length < 1) {
                container.style.display = 'none';
                container.innerHTML = '';
                return;
            }
            try {
                const url = `/Book/AutocompleteNombres?q=${encodeURIComponent(text)}`;
                const resp = await fetch(url, { method: 'GET', headers: { 'Accept': 'application/json' } });
                if (!resp.ok) throw new Error('Error en petición');
                const data = await resp.json();
                renderSuggestions(data || []);
            } catch (e) {
                container.style.display = 'none';
                container.innerHTML = '';
            }
        }

        function renderSuggestions(list) {
            container.innerHTML = '';
            if (!list || list.length === 0) { container.style.display = 'none'; return; }
            list.forEach(item => {
                const div = document.createElement('div');
                div.className = 'autocomplete-item';
                div.textContent = item;
                div.addEventListener('click', () => {
                    input.value = item; // al seleccionar, se completa el input
                    container.style.display = 'none';
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
