console.log("entra a js")
// const input = document.getElementById("about");
// input.style.width = input.scrollWidth + "px";
const aboutMeContainer = document.getElementById("aboutMeContainer")
const btnEditAboutMe = document.getElementById("btnEditAboutMe")
const aboutMe = document.getElementById("aboutMe")
const searchInput = document.getElementById("searchInput");

// Funciones helper
function pasarAnoATexto(ano) {
    switch(ano) {
        case 1: return "7mo";
        case 2: return "1ero";
        case 3: return "2ndo";
        case 4: return "3ero";
        case 5: return "4to";
        case 6: return "5to";
        default: return "Desconocido";
    }
}

function toUpperPrimeraLetra(texto) {
    if (!texto) return texto;
    return texto.split(' ').map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()).join(' ');
}

function getColor(estado) {
    switch(estado) {
        case "Como nuevo": return "var(--secondary2)";
        case "Pocas anotaciones": return "var(--accent)";
        case "Con algunas anotaciones": return "var(--accent)";
        case "Muy anotado": return "var(--red)";
        case "Muy usado": return "var(--red)";
        default: return "white";
    }
}
const container = document.getElementById("resultados");
if (searchInput && container) {
    realizarBusqueda(searchInput.value.trim())
    searchInput.focus();
    const len = searchInput.value ? searchInput.value.length : 0;
    if (typeof searchInput.setSelectionRange === 'function') {
        searchInput.setSelectionRange(len, len);
    } else {
        searchInput.selectionStart = searchInput.selectionEnd = len;
    }
}

async function realizarBusqueda(query) {
    if (query !== null && query !== undefined) {
        try{
            const materia = document.getElementById("filtroMateria")?.value?.trim() ?? "";
            const ano = document.getElementById("filtroAno")?.value?.trim() ?? "";
            const estado = document.getElementById("filtroEstado")?.value?.trim() ?? "";
            const precioMin = document.getElementById("filtroPrecioMin")?.value?.trim() ?? "";
            const precioMax = document.getElementById("filtroPrecioMax")?.value?.trim() ?? "";

            const params = new URLSearchParams({
                query: query ?? "",
                materia,
                ano,
                estado,
                precioMin,
                precioMax
            });

            const res = await fetch(`/Home/Buscar?${params.toString()}`);
            const data = await res.json();
            if (container) {
                let html = '';
                const token = document.querySelector('input[name="__RequestVerificationToken"]');
                const tokenInput = token ? `<input type="hidden" name="__RequestVerificationToken" value="${token.value}">` : '';
                if (data.publicaciones && data.publicaciones.length > 0) {
                    data.publicaciones.forEach(libro => {
                        const imgSrc = libro.imagen ? `data:image/webp;base64,${libro.imagen}` : '/img/book-placeholder.webp';
                        html += `
                            <div class="libro" onclick="window.location.href='/Book/Detalle?id=${libro.id}&idVendedor=${libro.idVendedor}'">
                                <div class="libroImgContainer">
                                    <img src="${imgSrc}" alt="imagen del libro" />
                                    <section class="libroActionsContainer">
                                        <form class="desearBtnForm hoverVerde" action="/Book/Desear" method="post" style="display:inline;">
                                            ${tokenInput}
                                            <input type="hidden" name="id" value="${libro.id}" />
                                            <button type="submit" onclick="event.stopPropagation();">
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
                                    <span class="pill" style="background-color:${getColor(libro.estadoLibro)};">${libro.estadoLibro}</span>
                                    <span class="pill">${pasarAnoATexto(libro.ano)}</span>
                                </div>
                            </div>
                        `;
                    });
                } else {
                    html = '<div class="no-result"><p>No se encontraron resultados.</p></div>';
                }
                container.innerHTML = html;
            }
        } catch (error) {
            console.error("Error al buscar:", error);
        }
    } else {
        // Limpia resultados si query está vacío
        const container = document.getElementById("resultados");
        if (container) container.innerHTML = '<div class="no-result"><p>No se encontraron resultados.</p></div>';
    }
}

let debounceTimer;
if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();
        if (query.length === 1) {
            window.location.href = `/Home/Buscar?query=${encodeURIComponent(query)}`;
        }
        debounceTimer = setTimeout(async () => {
            realizarBusqueda(query);
        }, 300);  // Espera 300ms
    });
}

// Especialidad deshabilitado
const anoSelect = document.getElementById('ano');
const especialidadSelect = document.getElementById('especialidad');
if(anoSelect){
    anoSelect.addEventListener('change', () => {
      const valor = parseInt(anoSelect.value);
   
   
      // Deshabilita si el año es menor a 3 o no es un número
      const deshabilitado = isNaN(valor) || valor < 4;
      especialidadSelect.disabled = deshabilitado;
   
   
      // Si está habilitado, que sea requerido; si no, quita el atributo
      if (deshabilitado) {
        especialidadSelect.removeAttribute('required');
      } else {
        especialidadSelect.setAttribute('required', '');
      }
    });
}


let aboutMeInput = aboutMe.textContent


function updateAboutMeInput(){
    aboutMeInput = document.getElementById("aboutMeTextarea").value
}


btnEditAboutMe.addEventListener("click", editarAboutMe)


function editarAboutMe() {
    const tokenEl = aboutMeContainer ? aboutMeContainer.querySelector('input[name="__RequestVerificationToken"]') : null;
    const tokenInputHtml = tokenEl ? `<input type="hidden" name="__RequestVerificationToken" value="${tokenEl.value}">` : '';

    aboutMeContainer.innerHTML = `
        ${tokenInputHtml}
        <textarea name="aboutMe" onchange="updateAboutMeInput()" id="aboutMeTextarea" maxlength="200" placeholder="Escribí algo sobre vos..." class="aboutMeInput" rows="3">${aboutMeInput}</textarea>
        <button class="mainBtn" type="submit" style="width: min-content">Guardar</button>
    `;

    setTimeout(() => {
        const ta = document.getElementById('aboutMeTextarea');
        if (ta) {
            ta.focus();
            const len = ta.value ? ta.value.length : 0;
            if (typeof ta.setSelectionRange === 'function') {
                ta.setSelectionRange(len, len);
            } else {
                ta.selectionStart = ta.selectionEnd = len;
            }
        }
    }, 0);
}


//Solo letras en curso
const inputCurso = document.getElementById("curso");
if(inputCurso){
    inputCurso.addEventListener("input", function () {
        this.value = this.value.replace(/[^a-zA-Z]/g, '');
        this.value = this.value.toUpperCase();
    });
}


// ========== MANEJO DE IMAGEN - VERSIÓN CORRECTA ==========
document.addEventListener('DOMContentLoaded', function() {
    console.log('DOMContentLoaded - Inicializando manejo de imagen');
    
    const fileInput = document.getElementById('fileInput');
    
    if (fileInput) {
        console.log('✓ fileInput encontrado, adjuntando listener');
        
        fileInput.addEventListener('change', function(event) {
            console.log('✓ Change event disparado');
            const file = this.files[0];
            
            if (file) {
                console.log('✓ Archivo seleccionado:', file.name);
                
                // 1. Actualizar nombre del archivo
                const fileName = document.getElementById('fileName');
                if (fileName) {
                    fileName.textContent = file.name;
                    console.log('✓ Nombre actualizado a:', file.name);
                }
                
                // 2. Actualizar preview de imagen
                const imagenPreview = document.getElementById('imagenPreview');
                if (imagenPreview) {
                    const reader = new FileReader();
                    reader.onload = function(e) {
                        imagenPreview.src = e.target.result;
                        console.log('✓ Preview actualizada');
                    };
                    reader.readAsDataURL(file);
                }
                
                // 3. Actualizar estado
                const estadoImagen = document.getElementById('estadoImagen');
                if (estadoImagen) {
                    estadoImagen.textContent = 'Nueva imagen seleccionada';
                    console.log('✓ Estado actualizado');
                }
                
                // 4. Limpiar flag de eliminación
                const imagenEliminada = document.getElementById('imagenEliminada');
                if (imagenEliminada) {
                    imagenEliminada.value = 'false';
                }
                
                // 5. Mostrar botón eliminar
                const deleteBtn = document.querySelector('.desearBtnForm');
                if (deleteBtn) {
                    deleteBtn.style.display = 'inline-block';
                    console.log('✓ Botón eliminar mostrado');
                }
            }
        });
    } else {
        console.log('✗ fileInput NO encontrado');
    }
});

// Eliminar la imagen actual
function eliminarImagenActual(event) {
    event.preventDefault();
    if (confirm('¿Está seguro de que desea eliminar la imagen actual? Se usará la imagen predeterminada del libro.')) {
        // Marcar que se eliminó la imagen
        const imagenEliminada = document.getElementById('imagenEliminada');
        if (imagenEliminada) {
            imagenEliminada.value = 'true';
        }
        
        // Cambiar la preview a la imagen predeterminada
        const imagenPreview = document.getElementById('imagenPreview');
        if (imagenPreview) {
            imagenPreview.src = '/img/book-placeholder.webp';
        }
        
        // Cambiar el estado
        const estadoImagen = document.getElementById('estadoImagen');
        if (estadoImagen) {
            estadoImagen.textContent = 'Imagen predeterminada';
        }
        
        // Ocultar el botón de eliminar
        const desearBtnForm = document.querySelector('.desearBtnForm');
        if (desearBtnForm) {
            desearBtnForm.style.display = 'none';
        }
        
        // Limpiar el input de archivo
        const fileInput = document.getElementById('fileInput');
        if (fileInput) {
            fileInput.value = '';
        }
        
        // Actualizar el texto del archivo
        const fileName = document.getElementById('fileName');
        if (fileName) {
            fileName.textContent = 'Archivo no encontrado';
        }
    }
}