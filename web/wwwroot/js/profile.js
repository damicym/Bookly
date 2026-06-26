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

// ===== PROFILE PAGE: tabs, favoritos, foto, modal eliminar =====

function activarTab(nombre) {
    document.querySelectorAll('.profile-tab').forEach(function (t) { t.classList.remove('active') })
    document.querySelectorAll('.profile-tab-panel').forEach(function (p) { p.classList.remove('active') })
    const tab = document.querySelector('.profile-tab[data-tab="' + nombre + '"]')
    const panel = document.getElementById('tab-' + nombre)
    if (tab) tab.classList.add('active')
    if (panel) panel.classList.add('active')
}

if (document.querySelector('.profile-page')) {
    document.querySelectorAll('.profile-tab').forEach(function (tab) {
        tab.addEventListener('click', function () {
            activarTab(tab.dataset.tab)
        })
    })

    if (window.location.hash === '#favoritos') {
        activarTab('favoritos')
        history.replaceState(null, '', window.location.pathname)
    }
}

async function quitarFavorito(event, form, cardId) {
    event.preventDefault()
    event.stopPropagation()

    const action = form.getAttribute('action') || '/Book/Desear'
    const tokenEl = form.querySelector('input[name="__RequestVerificationToken"]')
    const token = tokenEl ? tokenEl.value : null
    const formData = new FormData(form)
    formData.set('esDeseado', 'true')

    try {
        const headers = token ? { 'RequestVerificationToken': token } : {}
        const res = await fetch(action, { method: 'POST', body: formData, headers })
        const data = await res.json().catch(() => null)
        if (data && data.success) {
            const card = document.getElementById(cardId)
            if (card) {
                card.style.transition = 'opacity 0.25s ease, transform 0.25s ease'
                card.style.opacity = '0'
                card.style.transform = 'scale(0.95)'
                setTimeout(() => {
                    card.remove()
                    const statNums = document.querySelectorAll('.profile-stat-num')
                    const favStat = Array.from(statNums).find(el =>
                        el.nextElementSibling?.textContent.trim() === 'favoritos'
                    )
                    if (favStat) {
                        const current = parseInt(favStat.textContent, 10)
                        favStat.textContent = Math.max(0, current - 1)
                    }

                    const favoritosContainer = document.getElementById('favoritosCardsContainer')
                    const remainingCards = favoritosContainer ? favoritosContainer.querySelectorAll('.libro[id^="fav-card-"]').length : 0
                    let emptyState = favoritosContainer ? favoritosContainer.querySelector('.no-result') : null

                    if (remainingCards === 0 && favoritosContainer) {
                        if (!emptyState) {
                            emptyState = document.createElement('div')
                            emptyState.className = 'no-result'
                            emptyState.innerHTML = '<p>Todavía no agregaste libros a favoritos.</p>'
                            favoritosContainer.appendChild(emptyState)
                        }
                    }
                }, 260)
            }
        }
    } catch (err) {
        console.error('Error al quitar favorito:', err)
    }

    return false
}

(function () {
    const container = document.getElementById('avatarContainer')
    const input = document.getElementById('fotoPerfilInput')
    const form = document.getElementById('fotoPerfilForm')
    const img = document.getElementById('profileAvatarImg')
    const label = document.querySelector('.profile-avatar-overlay-label')
    if (!container || !input || !form || !img) return

    container.addEventListener('click', function () {
        input.click()
    })

    input.addEventListener('change', async function () {
        const file = this.files[0]
        if (!file) return

        const reader = new FileReader()
        reader.onload = e => { img.src = e.target.result }
        reader.readAsDataURL(file)

        const formData = new FormData(form)
        formData.set('fotoPerfil', file)
        const token = form.querySelector('input[name="__RequestVerificationToken"]').value

        try {
            const res = await fetch(form.action, {
                method: 'POST',
                body: formData,
                headers: { 'RequestVerificationToken': token }
            })
            const data = await res.json()
            if (data && data.success) {
                const nuevaSrc = (data.src || data.url) + '?t=' + Date.now()
                img.src = nuevaSrc
                if (label) label.textContent = 'Cambiar foto'
                var navAvatar = document.querySelector('.nav-avatar')
                if (navAvatar) {
                    navAvatar.src = nuevaSrc
                } else {
                    var svgBtn = document.querySelector('.profileBtn a .simpleBtn')
                    if (svgBtn) {
                        var newImg = document.createElement('img')
                        newImg.src = nuevaSrc
                        newImg.alt = 'foto de perfil'
                        newImg.className = 'nav-avatar'
                        svgBtn.replaceWith(newImg)
                    }
                }
                if (!document.getElementById('btnEliminarFoto')) {
                    location.reload()
                }
            } else {
                alert(data?.message || data?.error || 'Error al subir la foto')
            }
        } catch (e) {
            console.error('Error en fetch:', e)
        }
    })

    const btnEliminar = document.getElementById('btnEliminarFoto')
    const eliminarFotoForm = document.getElementById('eliminarFotoForm')
    if (btnEliminar && eliminarFotoForm) {
        btnEliminar.addEventListener('click', async function () {
            const token = eliminarFotoForm.querySelector('input[name="__RequestVerificationToken"]').value
            try {
                const res = await fetch(eliminarFotoForm.action, {
                    method: 'POST',
                    headers: { 'RequestVerificationToken': token }
                })
                const data = await res.json()
                if (data && data.success) {
                    img.src = '/img/default.webp'
                    if (label) label.textContent = 'Subir foto'
                    btnEliminar.remove()
                    eliminarFotoForm.remove()
                    var navAvatar = document.querySelector('.nav-avatar')
                    if (navAvatar) {
                        var svgIcon = document.createElementNS('http://www.w3.org/2000/svg', 'svg')
                        svgIcon.setAttribute('class', 'simpleBtn')
                        svgIcon.setAttribute('xmlns', 'http://www.w3.org/2000/svg')
                        svgIcon.setAttribute('width', '50')
                        svgIcon.setAttribute('height', '50')
                        svgIcon.setAttribute('viewBox', '0 0 24 24')
                        svgIcon.setAttribute('fill', 'none')
                        svgIcon.setAttribute('stroke', 'currentColor')
                        svgIcon.setAttribute('stroke-width', '1')
                        svgIcon.setAttribute('stroke-linecap', 'round')
                        svgIcon.setAttribute('stroke-linejoin', 'round')
                        svgIcon.innerHTML = '<path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 12m-9 0a9 9 0 1 0 18 0a9 9 0 1 0 -18 0" /><path d="M12 10m-3 0a3 3 0 1 0 6 0a3 3 0 1 0 -6 0" /><path d="M6.168 18.849a4 4 0 0 1 3.832 -2.849h4a4 4 0 0 1 3.834 2.855" />'
                        navAvatar.replaceWith(svgIcon)
                    }
                } else {
                    alert(data?.message || 'Error al eliminar la foto')
                }
            } catch (e) {
                console.error('Error al eliminar foto:', e)
            }
        })
    }
})()

;(function () {
    var modal = document.getElementById('eliminarModal')
    if (!modal) return
    var formIdPendiente = null

    window.mostrarConfirmEliminar = function (formId) {
        formIdPendiente = formId
        modal.style.display = 'flex'
        document.body.style.overflow = 'hidden'
    }

    document.getElementById('eliminarCancelarBtn').addEventListener('click', function () {
        modal.style.display = 'none'
        document.body.style.overflow = ''
        formIdPendiente = null
    })

    document.getElementById('eliminarAceptarBtn').addEventListener('click', function () {
        if (formIdPendiente) {
            document.getElementById(formIdPendiente).submit()
        }
        modal.style.display = 'none'
        document.body.style.overflow = ''
    })

    modal.addEventListener('click', function (e) {
        if (e.target === modal) {
            modal.style.display = 'none'
            document.body.style.overflow = ''
            formIdPendiente = null
        }
    })

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && modal.style.display === 'flex') {
            modal.style.display = 'none'
            document.body.style.overflow = ''
            formIdPendiente = null
        }
    })
})()
