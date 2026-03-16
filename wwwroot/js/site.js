console.log("entra a js")
// const input = document.getElementById("about");
// input.style.width = input.scrollWidth + "px";
const aboutMeContainer = document.getElementById("aboutMeContainer")
const btnEditAboutMe = document.getElementById("btnEditAboutMe")
const aboutMe = document.getElementById("aboutMe")
const searchInput = document.getElementById("searchInput");

// if(searchInput){
//     searchInput.addEventListener("input", (e) => {
//         const query = e.target.value.trim();
//         if(query){
//             window.location.href = `Home/Buscar?query=${encodeURIComponent(query)}`;
//         }
//     });
// }

let debounceTimer;

if (searchInput) {
    searchInput.addEventListener("input", (e) => {
        clearTimeout(debounceTimer);
        const query = e.target.value.trim();
        
        debounceTimer = setTimeout(async () => {
            if (query) {
                try{
                    // ver si hacerle fetch a eso y cambiar backend, o a otra cosa
                    const res = await fetch(`Home/Buscar?query=${encodeURIComponent(query)}`);
                    const data = await res.json();
                    const container = document.getElementById("resultados");
                    if (container) {
                        container.innerHTML = data.html;
                    }
                } catch (error) {
                    console.error("Error al buscar:", error);
                }
            } else {
                // Limpia resultados si query está vacío
                const container = document.getElementById("resultados");
                if (container) container.innerHTML = "";
            }
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