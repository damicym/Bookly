console.log("entra a js")
// const input = document.getElementById("about");
// input.style.width = input.scrollWidth + "px";
const aboutMeContainer = document.getElementById("aboutMeContainer")
const btnEditAboutMe = document.getElementById("btnEditAboutMe")
const aboutMe = document.getElementById("aboutMe")

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
    aboutMeContainer.innerHTML = `
        <form class="aboutMeContainer" onsubmit="submitAboutMe(event)">
            <textarea onchange="updateAboutMeInput()" id="aboutMeTextarea" maxlength="200" required placeholder="Escribí algo sobre vos..." id="aboutMeTextarea" class="aboutMeInput" rows="3">${aboutMeInput}</textarea>
            <button class="mainBtn" type="submit" style="width: min-content">Guardar</button>
        </form>
    `
}

function submitAboutMe(e){
    const aboutMeTextarea = document.getElementById("aboutMeTextarea")
    e.preventDefault()
    if (aboutMeTextarea.value.trim() === "") {
        alert("No puede estar vacío")
    } else {
        aboutMeContainer.innerHTML = `
        <p class="aboutMe">${aboutMeInput}</p>
        <button id="btnEditAboutMe" onclick="editarAboutMe()">
            <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-edit"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1" /><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z" /><path d="M16 5l3 3" /></svg>
        </button>
        `
    }
}

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
