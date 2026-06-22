// ===== PROFILE: about me y validaciones del formulario de perfil =====

const aboutMeContainer = document.getElementById("aboutMeContainer")
const btnEditAboutMe = document.getElementById("btnEditAboutMe")
const aboutMeP = document.getElementById("aboutMe")
const aboutMeEditable = document.getElementById("aboutMeEditable")
const aboutMeBioView = document.getElementById("aboutMeBioView")

if (btnEditAboutMe) {
    btnEditAboutMe.addEventListener("click", editarAboutMe)
}

function editarAboutMe() {
    const textoActual = aboutMeP ? aboutMeP.textContent.trim() : ''

    // Ocultar la fila de texto + botón editar
    if (aboutMeBioView) aboutMeBioView.style.display = 'none'

    // Mostrar botón eliminar foto si existe
    const btnEliminarFoto = document.getElementById('btnEliminarFoto')
    if (btnEliminarFoto) btnEliminarFoto.style.display = 'flex'

    // Inyectar textarea, botón guardar y cancelar
    aboutMeEditable.innerHTML = `
        <div class="profile-bio-edit-wrap">
            <textarea name="aboutMe" id="aboutMeTextarea" maxlength="200" placeholder="Escribí algo sobre vos..." class="aboutMeInput" rows="3">${textoActual}</textarea>
            <div class="profile-bio-actions">
                <button class="profile-bio-save-btn" type="submit" id="aboutMeSaveBtn">Guardar</button>
                <button class="profile-bio-cancel-btn" type="button" id="btnCancelAboutMe">Cancelar</button>
            </div>
        </div>
    `

    document.getElementById('btnCancelAboutMe').addEventListener('click', cancelarAboutMe)

    // Disable save btn on submit
    const aboutMeForm = document.getElementById('aboutMeContainer')
    if (aboutMeForm) {
        aboutMeForm.addEventListener('submit', function onSubmitAboutMe() {
            const saveBtn = document.getElementById('aboutMeSaveBtn')
            if (typeof setButtonLoading === 'function') setButtonLoading(saveBtn, true)
            aboutMeForm.removeEventListener('submit', onSubmitAboutMe)
        }, { once: true })
    }

    setTimeout(() => {
        const ta = document.getElementById('aboutMeTextarea')
        if (ta) {
            ta.focus()
            const len = ta.value ? ta.value.length : 0
            if (typeof ta.setSelectionRange === 'function') {
                ta.setSelectionRange(len, len)
            }
        }
    }, 0)
}

function cancelarAboutMe() {
    aboutMeEditable.innerHTML = ''
    if (aboutMeBioView) aboutMeBioView.style.display = 'flex'

    // Ocultar botón eliminar foto
    const btnEliminarFoto = document.getElementById('btnEliminarFoto')
    if (btnEliminarFoto) btnEliminarFoto.style.display = 'none'
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
