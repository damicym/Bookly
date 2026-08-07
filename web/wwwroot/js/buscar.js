// ===== BUSCAR: catálogo, búsqueda, filtros y chips =====

const container = document.getElementById("resultados")

if (searchInput && container) {
    realizarBusqueda(searchInput.value.trim(), true)
    searchInput.focus()
    const len = searchInput.value ? searchInput.value.length : 0
    if (typeof searchInput.setSelectionRange === 'function') {
        searchInput.setSelectionRange(len, len)
    } else {
        searchInput.selectionStart = searchInput.selectionEnd = len
    }
}

function mostrarSkeleton(cantidad = 10) {
    if (!container) return
    const skeletonCard = `
        <div class="libro-skeleton">
            <div class="skeleton-block skeleton-img"></div>
            <div class="skeleton-block skeleton-titulo"></div>
            <div class="skeleton-block skeleton-titulo-2"></div>
            <div class="skeleton-block skeleton-materia"></div>
            <div class="skeleton-block skeleton-precio"></div>
        </div>`
    const skeletonSubtitulo = `<h3 class="catalogo-seccion-titulo skeleton-seccion-titulo"><span class="skeleton-block skeleton-subtitulo"></span></h3>`
    container.innerHTML = skeletonSubtitulo + skeletonCard.repeat(cantidad)
}

async function realizarBusqueda(query, esCargaInicial) {
    if (query !== null && query !== undefined) {
        mostrarSkeleton()
        try{
            // Soporte para selects (legacy) y radio buttons (nuevo diseño)
            const getRadioVal = (name) => {
                const checked = document.querySelector(`input[name="${name}"]:checked`)
                return checked ? checked.value.trim() : ""
            }
            const materia = document.getElementById("filtroMateria")?.value?.trim() ?? getRadioVal("filtroMateria")
            const ano = document.getElementById("filtroAno")?.value?.trim() ?? getRadioVal("filtroAno")
            const estado = document.getElementById("filtroEstado")?.value?.trim() ?? getRadioVal("filtroEstado")
            const editorial = document.getElementById("filtroEditoriales")?.value?.trim() ?? getRadioVal("filtroEditoriales")
            const precioMin = limpiarPrecio(document.getElementById("filtroPrecioMin")?.value?.trim() ?? "")
            const precioMax = limpiarPrecio(document.getElementById("filtroPrecioMax")?.value?.trim() ?? "")
            const ordenEstado = document.getElementById('selectOrdenEstado')?.value ?? ""
            const ordenPrecio = document.getElementById('selectOrdenPrecio')?.value ?? ""

            const params = new URLSearchParams({
                query: query ?? "",
                materia,
                ano,
                estado,
                editorial,
                precioMin,
                precioMax,
                ordenEstado,
                ordenPrecio
            })

            const res = await fetch(`/Home/Buscar?${params.toString()}`)
            
            if (!res.ok) {
                throw new Error(`Error HTTP: ${res.status}`)
            }
            
            const data = await res.json()

            if (container) {
                let html = ''
                const token = document.querySelector('input[name="__RequestVerificationToken"]')
                const tokenInput = token ? `<input type="hidden" name="__RequestVerificationToken" value="${token.value}">` : ''
                if (data.publicaciones && data.publicaciones.length > 0) {
                    const hayOrden = ordenEstado !== '' || ordenPrecio !== ''
                    let anteriorFueProtagonista = data.publicaciones[0]?.esMasBarato ?? false
                    let huboCambio = false
                    const hayProtagonistas = !hayOrden && data.publicaciones.some(l => l.esMasBarato)
                    if (hayProtagonistas) {
                        html += `<h3 class="catalogo-seccion-titulo"><span>Mejores precios</span></h3>`
                    }
                    data.publicaciones.forEach(libro => {
                        const imgSrc = libro.imagen ? libro.imagen : '/img/book-placeholder.webp'
                        const tagMasBarato = libro.esMasBarato ? `<span class="tag-masbarato"><svg class="tag-rayo" xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24" fill="currentColor" stroke="none"><path d="M13 2L4.5 13.5H11L10 22L19.5 10.5H13L13 2Z"/></svg> Mejor precio</span>` : ''
                        const claseCard = (!hayOrden && libro.esMasBarato) ? 'libro protagonista' : 'libro secundario'
                        if (!hayOrden && huboCambio && anteriorFueProtagonista && !libro.esMasBarato) {
                            html += `<hr class="separador-cards" />`
                        }
                        anteriorFueProtagonista = libro.esMasBarato
                        huboCambio = true
                        html += `
                            <div class="${claseCard}" onclick="window.location.href='/Book/Detalle?id=${libro.id}&idVendedor=${libro.id_vendedor}'">
                                <div class="imgContainer">
                                    <div class="libroImgContainer">
                                        <img src="${imgSrc}" alt="imagen del libro" loading="lazy" />
                                        ${tagMasBarato}
                                        <section class="libroActionsContainer">
                                            <form class="desearBtnForm hoverVerde" action="/Book/Desear" method="post" style="display:inline" onsubmit="return desearLibro(event, this)">
                                                ${tokenInput}
                                                <input type="hidden" name="id" value="${libro.id}" />
                                                <button ${libro.esDeseado ? 'class="deseado"' : ''} type="submit" onclick="event.stopPropagation()">
                                                    ${obtenerSvgDeseado(libro.esDeseado)}
                                                </button>
                                            </form>
                                        </section>
                                    </div>
                                    <div class="pillContainer">
                                        ${pasarAnoATexto(libro.ano)
                                            ? `<span class="pill">${pasarAnoATexto(libro.ano)}</span>`
                                            : ''
                                        }
                                        ${libro.estado_libro 
                                            ? `<span class="pill" style="background-color:${getColor(libro.estado_libro)}">${libro.estado_libro}</span>`
                                            : ''
                                        }
                                    </div>
                                </div>
                                <div class="nombreContainer">
                                    <h1>${toUpperPrimeraLetra(libro.nombre)}</h1>
                                </div>
                                <div class="libro-footer">
                                    ${libro.materia
                                        ? `<span class="libro-footer-materia">${toUpperPrimeraLetra(libro.materia)}</span>`
                                        : '<span></span>'
                                    }
                                    <h3>$${formatearMiles(String(libro.precio))}</h3>
                                </div>
                            </div>
                        `
                    })
                } else {
                    html = `<div class="no-result">
                        <div class="no-result-icon">
                            <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                                <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                                <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
                                <path d="M21 21l-6 -6" />
                            </svg>
                        </div>
                        <p class="no-result-title">Sin resultados</p>
                        <p class="no-result-sub">No encontramos libros que coincidan con tu búsqueda. Probá con otro nombre o ajustá los filtros.</p>
                    </div>`
                }
                container.innerHTML = html
            }
            if (esCargaInicial && typeof ocultarPageLoader === 'function') ocultarPageLoader()
        } catch (error) {
            console.error("Error al buscar:", error)
            if (esCargaInicial && typeof ocultarPageLoader === 'function') ocultarPageLoader()
            
            // Mostrar mensaje de error amigable al usuario
            if (container) {
                container.innerHTML = `<div class="no-result">
                    <div class="no-result-icon">
                        <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                            <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                            <path d="M12 9v4" />
                            <path d="M10.363 3.591l-8.106 13.534a1.914 1.914 0 0 0 1.636 2.871h16.214a1.914 1.914 0 0 0 1.636 -2.87l-8.106 -13.536a1.914 1.914 0 0 0 -3.274 0z" />
                            <path d="M12 16h.01" />
                        </svg>
                    </div>
                    <p class="no-result-title">Error de conexión</p>
                    <p class="no-result-sub">No se pudo conectar con el servidor. Verificá tu conexión a internet o que la API esté funcionando.</p>
                </div>`
            }
        }
    } else {
        // Limpia resultados si query está vacío
        const container = document.getElementById("resultados")
        if (container) container.innerHTML = `<div class="no-result">
            <div class="no-result-icon">
                <svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round">
                    <path stroke="none" d="M0 0h24v24H0z" fill="none"/>
                    <path d="M10 10m-7 0a7 7 0 1 0 14 0a7 7 0 1 0 -14 0" />
                    <path d="M21 21l-6 -6" />
                </svg>
            </div>
            <p class="no-result-title">Buscá un libro</p>
            <p class="no-result-sub">Escribí el nombre de un libro en la barra de búsqueda para ver resultados.</p>
        </div>`
        if (esCargaInicial && typeof ocultarPageLoader === 'function') ocultarPageLoader()
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

// También escuchar radio buttons de los filtros del sidebar
const radioFiltros = document.querySelectorAll(
    'input[name="filtroMateria"], input[name="filtroAno"], input[name="filtroEstado"], input[name="filtroEditoriales"]'
)

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

// Listeners para radio buttons del nuevo diseño
if (container && radioFiltros.length > 0) {
    radioFiltros.forEach((radio) => {
        radio.addEventListener("change", () => {
            mostrarSkeleton()
            clearTimeout(debounceTimer)
            const queryActual = searchInput?.value?.trim() ?? ""
            debounceTimer = setTimeout(() => {
                realizarBusqueda(queryActual)
                actualizarChipsFiltros()
                actualizarEstadoBotonLimpiar()
            }, 200)
        })
    })
}

// ===== SIDEBAR: grupos colapsables =====
document.querySelectorAll('.filtro-grupo-titulo').forEach(btn => {
    btn.addEventListener('click', () => {
        const targetId = btn.getAttribute('data-target')
        const lista = document.getElementById(targetId)
        if (!lista) return
        const expanded = btn.getAttribute('aria-expanded') === 'true'
        btn.setAttribute('aria-expanded', expanded ? 'false' : 'true')
        lista.classList.toggle('collapsed', expanded)
    })
})

// ===== CHIPS DE FILTROS ACTIVOS =====
const chipLabels = {
    filtroMateria: null,
    filtroAno: null,
    filtroEstado: { a: 'Como nuevo', b: 'Pocas anotaciones', d: 'Muy anotado' },
    filtroEditoriales: null
}

function actualizarChipsFiltros() {
    const chipsContainer = document.getElementById('filtrosActivosChips')
    if (!chipsContainer) return
    chipsContainer.innerHTML = ''

    // Chips de radios del sidebar
    const grupos = ['filtroMateria', 'filtroAno', 'filtroEstado', 'filtroEditoriales']
    grupos.forEach(name => {
        const checked = document.querySelector(`input[name="${name}"]:checked`)
        if (!checked || checked.value === '') return
        const label = checked.closest('.filtro-opcion')?.textContent?.trim() ?? checked.value
        const chip = document.createElement('span')
        chip.className = 'filtro-chip'
        chip.innerHTML = `${label} <span class="filtro-chip-x">✕</span>`
        chip.addEventListener('click', () => {
            const defaultRadio = document.querySelector(`input[name="${name}"][value=""]`)
            if (defaultRadio) {
                defaultRadio.checked = true
                clearTimeout(debounceTimer)
                debounceTimer = setTimeout(() => {
                    realizarBusqueda(searchInput?.value?.trim() ?? "")
                    actualizarChipsFiltros()
                    actualizarEstadoBotonLimpiar()
                }, 200)
            }
        })
        chipsContainer.appendChild(chip)
    })

    // Chips de selects de orden
    ;[
        { id: 'selectOrdenEstado' },
        { id: 'selectOrdenPrecio' }
    ].forEach(({ id }) => {
        const sel = document.getElementById(id)
        if (!sel || sel.value === '') return
        const label = sel.options[sel.selectedIndex]?.text ?? sel.value
        const chip = document.createElement('span')
        chip.className = 'filtro-chip'
        chip.innerHTML = `${label} <span class="filtro-chip-x">✕</span>`
        chip.addEventListener('click', () => {
            sel.value = ''
            sel.classList.remove('activo')
            // Resetear el dropdown custom asociado
            const customDropdown = document.querySelector(`.orden-custom-dropdown[data-select="${id}"]`)
            if (customDropdown) {
                const textEl = customDropdown.querySelector('.orden-custom-text')
                const btn = customDropdown.querySelector('.orden-custom-btn')
                const firstOpt = customDropdown.querySelector('.orden-custom-option[data-value=""]')
                if (textEl && firstOpt) textEl.textContent = firstOpt.textContent
                btn?.classList.remove('activo')
                customDropdown.querySelectorAll('.orden-custom-option').forEach(o => o.classList.remove('selected'))
            }
            clearTimeout(debounceTimer)
            debounceTimer = setTimeout(() => {
                realizarBusqueda(searchInput?.value?.trim() ?? "")
                actualizarChipsFiltros()
                actualizarEstadoBotonLimpiar()
            }, 200)
        })
        chipsContainer.appendChild(chip)
    })

    // Chip de rango de precio
    const precioMin = limpiarPrecio(document.getElementById('filtroPrecioMin')?.value ?? '')
    const precioMax = limpiarPrecio(document.getElementById('filtroPrecioMax')?.value ?? '')
    if (precioMin || precioMax) {
        const label = precioMin && precioMax ? `$${precioMin} — $${precioMax}` : precioMin ? `Desde $${precioMin}` : `Hasta $${precioMax}`
        const chip = document.createElement('span')
        chip.className = 'filtro-chip'
        chip.innerHTML = `${label} <span class="filtro-chip-x">✕</span>`
        chip.addEventListener('click', () => {
            const minEl = document.getElementById('filtroPrecioMin')
            const maxEl = document.getElementById('filtroPrecioMax')
            if (minEl) minEl.value = ''
            if (maxEl) maxEl.value = ''
            clearTimeout(debounceTimer)
            debounceTimer = setTimeout(() => {
                realizarBusqueda(searchInput?.value?.trim() ?? "")
                actualizarChipsFiltros()
                actualizarEstadoBotonLimpiar()
            }, 200)
        })
        chipsContainer.appendChild(chip)
    }
}

// Botón limpiar todos los filtros
const btnLimpiar = document.getElementById('btnLimpiarFiltros')

function actualizarEstadoBotonLimpiar() {
    if (!btnLimpiar) return
    const hayRadioActivo = ['filtroMateria', 'filtroAno', 'filtroEstado', 'filtroEditoriales'].some(name => {
        const checked = document.querySelector(`input[name="${name}"]:checked`)
        return checked && checked.value !== ''
    })
    const hayOrdenActivo = (document.getElementById('selectOrdenEstado')?.value ?? '') !== ''
        || (document.getElementById('selectOrdenPrecio')?.value ?? '') !== ''
    const precioMin = limpiarPrecio(document.getElementById('filtroPrecioMin')?.value ?? '')
    const precioMax = limpiarPrecio(document.getElementById('filtroPrecioMax')?.value ?? '')
    btnLimpiar.disabled = !hayRadioActivo && !hayOrdenActivo && !precioMin && !precioMax
}

if (btnLimpiar) {
    btnLimpiar.addEventListener('click', () => {
        document.querySelectorAll('.filtro-opcion input[value=""]').forEach(r => r.checked = true)
        const selE = document.getElementById('selectOrdenEstado')
        const selP = document.getElementById('selectOrdenPrecio')
        if (selE) { selE.value = ''; selE.classList.remove('activo') }
        if (selP) { selP.value = ''; selP.classList.remove('activo') }
        resetCustomDropdowns()
        const minEl = document.getElementById('filtroPrecioMin')
        const maxEl = document.getElementById('filtroPrecioMax')
        if (minEl) minEl.value = ''
        if (maxEl) maxEl.value = ''
        clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
            realizarBusqueda(searchInput?.value?.trim() ?? "")
            actualizarChipsFiltros()
            actualizarEstadoBotonLimpiar()
        }, 200)
    })
}

// Actualizar chips cuando cambian los inputs de precio
precioInputs.forEach(inputPrecio => {
    inputPrecio.addEventListener('input', () => {
        clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
            actualizarChipsFiltros()
            actualizarEstadoBotonLimpiar()
        }, 400)
    })
})

// Estado inicial del botón limpiar
actualizarEstadoBotonLimpiar()

// ===== DROPDOWNS DE ORDEN =====
const selectOrdenEstado = document.getElementById('selectOrdenEstado')
const selectOrdenPrecio = document.getElementById('selectOrdenPrecio')

;[selectOrdenEstado, selectOrdenPrecio].forEach(sel => {
    if (!sel) return
    sel.addEventListener('change', () => {
        sel.classList.toggle('activo', sel.value !== '')
        mostrarSkeleton()
        clearTimeout(debounceTimer)
        debounceTimer = setTimeout(() => {
            realizarBusqueda(searchInput?.value?.trim() ?? "")
            actualizarChipsFiltros()
            actualizarEstadoBotonLimpiar()
        }, 200)
    })
})

// ===== CUSTOM DROPDOWNS (UI) =====
document.querySelectorAll('.orden-custom-dropdown').forEach(dropdown => {
    const btn = dropdown.querySelector('.orden-custom-btn')
    const list = dropdown.querySelector('.orden-custom-list')
    const textEl = dropdown.querySelector('.orden-custom-text')
    const selectId = dropdown.dataset.select
    const hiddenSelect = document.getElementById(selectId)

    // Abrir / cerrar
    btn.addEventListener('click', (e) => {
        e.stopPropagation()
        const isOpen = dropdown.classList.contains('open')
        // Cerrar todos
        document.querySelectorAll('.orden-custom-dropdown.open').forEach(d => d.classList.remove('open'))
        document.querySelectorAll('.orden-custom-btn').forEach(b => b.setAttribute('aria-expanded', 'false'))
        if (!isOpen) {
            dropdown.classList.add('open')
            btn.setAttribute('aria-expanded', 'true')

            // En mobile: posicionar la lista con fixed para escapar del stacking context
            if (window.innerWidth <= 900) {
                const btnRect = btn.getBoundingClientRect()
                const listWidth = Math.max(list.offsetWidth || 140, 140)
                // Calcular si cabe a la derecha, si no abrir a la izquierda
                let leftPos = btnRect.left
                if (leftPos + listWidth > window.innerWidth - 12) {
                    leftPos = btnRect.right - listWidth
                }
                leftPos = Math.max(12, leftPos)
                list.style.top  = (btnRect.bottom + 6) + 'px'
                list.style.left = leftPos + 'px'
            } else {
                list.style.top  = ''
                list.style.left = ''
            }
        }
    })

    // Seleccionar opción
    list.querySelectorAll('.orden-custom-option').forEach(opt => {
        opt.addEventListener('click', () => {
            const value = opt.dataset.value
            const label = opt.textContent

            // Actualizar UI
            textEl.textContent = label
            list.querySelectorAll('.orden-custom-option').forEach(o => o.classList.remove('selected'))
            opt.classList.add('selected')
            btn.classList.toggle('activo', value !== '')
            dropdown.classList.remove('open')
            btn.setAttribute('aria-expanded', 'false')

            // Sincronizar hidden select y disparar change
            if (hiddenSelect) {
                hiddenSelect.value = value
                hiddenSelect.dispatchEvent(new Event('change'))
            }
        })
    })
})

// Cerrar dropdowns al hacer click fuera
document.addEventListener('click', () => {
    document.querySelectorAll('.orden-custom-dropdown.open').forEach(d => d.classList.remove('open'))
    document.querySelectorAll('.orden-custom-btn').forEach(b => b.setAttribute('aria-expanded', 'false'))
})

// Sincronizar custom dropdowns cuando se limpia desde el botón limpiar
function resetCustomDropdowns() {
    document.querySelectorAll('.orden-custom-dropdown').forEach(dropdown => {
        const textEl = dropdown.querySelector('.orden-custom-text')
        const btn = dropdown.querySelector('.orden-custom-btn')
        const firstOpt = dropdown.querySelector('.orden-custom-option[data-value=""]')
        if (textEl && firstOpt) textEl.textContent = firstOpt.textContent
        btn?.classList.remove('activo')
        dropdown.querySelectorAll('.orden-custom-option').forEach(o => o.classList.remove('selected'))
    })
}

// ===== TOGGLE SIDEBAR FILTROS (DESKTOP — >900px) =====
const btnToggleFiltros = document.getElementById('btnToggleFiltros')
const filtrosSidebar   = document.querySelector('.filtros-sidebar')
const catalogoLayout   = document.querySelector('.catalogo-layout')

if (btnToggleFiltros && filtrosSidebar) {
    btnToggleFiltros.addEventListener('click', () => {
        // Solo funciona en desktop
        if (window.innerWidth <= 900) return
        const isCollapsed = filtrosSidebar.classList.toggle('collapsed')
        catalogoLayout?.classList.toggle('sidebar-collapsed', isCollapsed)
        btnToggleFiltros.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true')
        btnToggleFiltros.setAttribute('aria-label',   isCollapsed ? 'Expandir filtros' : 'Colapsar filtros')
    })
}

// ===== TOGGLE PANEL FILTROS MÓVIL (≤900px) =====
const btnFiltrosMobile     = document.getElementById('btnFiltrosMobile')
const filtrosMobileOverlay = document.getElementById('filtrosMobileOverlay')

function esMobil() { return window.innerWidth <= 900 }

function abrirFiltrosMobile() {
    if (!filtrosSidebar) return
    // Limpiar clases del desktop que puedan interferir
    filtrosSidebar.classList.remove('collapsed')
    catalogoLayout?.classList.remove('sidebar-collapsed')

    // Posicionar el overlay debajo del header del catálogo, no del header global
    const catalogoHeader = document.querySelector('.catalogo-resultados-header')
    if (filtrosMobileOverlay && catalogoHeader) {
        const rect = catalogoHeader.getBoundingClientRect()
        filtrosMobileOverlay.style.top = (rect.bottom) + 'px'
    }

    filtrosSidebar.classList.add('mobile-open')
    filtrosMobileOverlay?.classList.add('active')
    btnFiltrosMobile?.setAttribute('aria-expanded', 'true')
    document.body.style.overflow = 'hidden'
}

function cerrarFiltrosMobile() {
    if (!filtrosSidebar) return
    filtrosSidebar.classList.remove('mobile-open')
    filtrosMobileOverlay?.classList.remove('active')
    btnFiltrosMobile?.setAttribute('aria-expanded', 'false')
    document.body.style.overflow = ''
}

if (btnFiltrosMobile) {
    // Usar tanto touchend como click para garantizar respuesta en mobile
    let touchHandled = false

    btnFiltrosMobile.addEventListener('touchend', (e) => {
        e.preventDefault()      // evita el click sintético posterior
        e.stopPropagation()
        touchHandled = true
        filtrosSidebar?.classList.contains('mobile-open')
            ? cerrarFiltrosMobile()
            : abrirFiltrosMobile()
        setTimeout(() => { touchHandled = false }, 400)
    })

    btnFiltrosMobile.addEventListener('click', (e) => {
        e.stopPropagation()
        if (touchHandled) return   // ya procesado por touchend
        filtrosSidebar?.classList.contains('mobile-open')
            ? cerrarFiltrosMobile()
            : abrirFiltrosMobile()
    })
}

if (filtrosMobileOverlay) {
    filtrosMobileOverlay.addEventListener('touchend', (e) => {
        e.preventDefault()
        cerrarFiltrosMobile()
    })
    filtrosMobileOverlay.addEventListener('click', cerrarFiltrosMobile)
}

// Cerrar al seleccionar un filtro en móvil
if (radioFiltros.length > 0) {
    radioFiltros.forEach(radio => {
        radio.addEventListener('change', () => {
            if (esMobil()) setTimeout(cerrarFiltrosMobile, 200)
        })
    })
}

// Al redimensionar entre desktop y móvil: limpiar estado
window.addEventListener('resize', () => {
    if (!esMobil()) {
        // Pasar a desktop: limpiar estado móvil
        filtrosSidebar?.classList.remove('mobile-open')
        filtrosMobileOverlay?.classList.remove('active')
        document.body.style.overflow = ''
        btnFiltrosMobile?.setAttribute('aria-expanded', 'false')
    } else {
        // Pasar a móvil: limpiar estado desktop
        filtrosSidebar?.classList.remove('collapsed')
        catalogoLayout?.classList.remove('sidebar-collapsed')
    }
})

// ===== BADGE FILTROS ACTIVOS EN BOTÓN MÓVIL =====
const badge = document.getElementById('filtrosMobileBadge')

function actualizarBadgeMobile() {
    if (!badge) return
    let count = 0
    // Radios activos
    ;['filtroMateria', 'filtroAno', 'filtroEstado', 'filtroEditoriales'].forEach(name => {
        const checked = document.querySelector(`input[name="${name}"]:checked`)
        if (checked && checked.value !== '') count++
    })
    // Precio
    const precioMin = limpiarPrecio(document.getElementById('filtroPrecioMin')?.value ?? '')
    const precioMax = limpiarPrecio(document.getElementById('filtroPrecioMax')?.value ?? '')
    if (precioMin || precioMax) count++
    // Orden
    if ((document.getElementById('selectOrdenEstado')?.value ?? '') !== '') count++
    if ((document.getElementById('selectOrdenPrecio')?.value ?? '') !== '') count++

    if (count > 0) {
        badge.textContent = count
        badge.removeAttribute('hidden')
    } else {
        badge.setAttribute('hidden', '')
    }
}

// Actualizar badge cuando cambia cualquier filtro
radioFiltros.forEach(r => r.addEventListener('change', actualizarBadgeMobile))
precioInputs.forEach(i => i.addEventListener('input', () => setTimeout(actualizarBadgeMobile, 420)))
;[document.getElementById('selectOrdenEstado'), document.getElementById('selectOrdenPrecio')]
    .filter(Boolean)
    .forEach(s => s.addEventListener('change', actualizarBadgeMobile))
if (btnLimpiar) btnLimpiar.addEventListener('click', () => setTimeout(actualizarBadgeMobile, 250))

// Estado inicial del badge
actualizarBadgeMobile()
