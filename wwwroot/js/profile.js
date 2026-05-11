// ===== PROFILE: about me y validaciones del formulario de perfil =====

const aboutMeContainer = document.getElementById("aboutMeContainer")
const btnEditAboutMe = document.getElementById("btnEditAboutMe")
const aboutMe = document.getElementById("aboutMe")

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

// Solo letras en curso
const inputCurso = document.getElementById("curso")
if(inputCurso){
    inputCurso.addEventListener("input", function () {
        this.value = this.value.replace(/[^a-zA-Z]/g, '')
        this.value = this.value.toUpperCase()
    })
}

// Especialidad deshabilitado según año
const anoSelect = document.getElementById('ano')
const especialidadSelect = document.getElementById('especialidad')
if(anoSelect){
    anoSelect.addEventListener('change', () => {
        const valor = parseInt(anoSelect.value)

        // Deshabilita si el año es menor a 3 o no es un número
        const deshabilitado = isNaN(valor) || valor < 4
        especialidadSelect.disabled = deshabilitado

        // Si está habilitado, que sea requerido; si no, quita el atributo
        if (deshabilitado) {
            especialidadSelect.removeAttribute('required')
        } else {
            especialidadSelect.setAttribute('required', '')
        }
    })
}
