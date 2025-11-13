// Especialidad deshabilitado
const anoSelect = document.getElementById('ano');
const especialidadSelect = document.getElementById('especialidad');


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


//Solo letras en curso
const inputCurso = document.getElementById("curso");

inputCurso.addEventListener("input", function () {
    this.value = this.value.replace(/[^a-zA-Z]/g, '');
    this.value = this.value.toUpperCase();
});

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


