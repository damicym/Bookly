console.log("entra a js")
const input = document.getElementById("about");
if(input) {
    input.style.width = input.scrollWidth + "px";
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

//Solo letras en curso
const inputCurso = document.getElementById("curso");
if(inputCurso) {
    inputCurso.addEventListener("input", function () {
        this.value = this.value.replace(/[^a-zA-Z]/g, '');
        this.value = this.value.toUpperCase();
    });
}

(function () {
  const searchUrl = '@Url.Action("Buscar", "Home")'; // <-- Cambiado a Home

  function doSearch(q) {
      q = (q || '').trim();
      if (!q) return;
      window.location.href = searchUrl + '?query=' + encodeURIComponent(q);
  }

  const input = document.getElementById('siteSearch');
  const icon = document.getElementById('siteSearchIcon');

  if (input) {
      input.addEventListener('keydown', function (e) {
          if (e.key === 'Enter') {
              const q = input.value;
              if (q && q.trim().length > 0) {
                  e.preventDefault();
                  doSearch(q);
              }
          }
      });
  }

  if (icon) {
      icon.style.cursor = 'pointer';
      icon.addEventListener('click', function () {
          if (!input) return;
          const q = input.value;
          if (q && q.trim().length > 0) {
              doSearch(q);
          }
      });
  }
})();

// Esperar a que el DOM esté completamente cargado
document.addEventListener('DOMContentLoaded', function() {
    // Detectar cuando se carga una imagen y actualizar el preview y el texto
    const fileInput = document.getElementById('fileInput');
    
    if (fileInput) {
        fileInput.addEventListener('change', function(event) {
            const file = this.files[0];
            
            if (file) {
                // Actualizar el nombre del archivo
                const fileNameElement = document.getElementById('fileName');
                if (fileNameElement) {
                    fileNameElement.textContent = file.name;
                }
                
                // Crear un FileReader para mostrar la preview
                const reader = new FileReader();
                reader.onload = function(e) {
                    const imagenPreview = document.getElementById('imagenPreview');
                    const estadoImagen = document.getElementById('estadoImagen');
                    const imagenEliminada = document.getElementById('imagenEliminada');
                    
                    if (imagenPreview) {
                        imagenPreview.src = e.target.result;
                    }
                    if (estadoImagen) {
                        estadoImagen.textContent = 'Nueva imagen seleccionada';
                    }
                    if (imagenEliminada) {
                        imagenEliminada.value = 'false';
                    }
                };
                reader.readAsDataURL(file);
            }
        });
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
            fileName.textContent = 'Archivo no cambiado';
        }
    }
}