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
    container.innerHTML = skeletonCard.repeat(cantidad)
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
            const ordenEstado = getRadioVal("filtroOrdenEstado")
            const ordenPrecio = getRadioVal("filtroOrdenPrecio")

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
                                        ${libro.estado_libro 
                                            ? `<span class="pill" style="background-color:${getColor(libro.estado_libro)}">${libro.estado_libro}</span>`
                                            : ''
                                        }
                                        ${pasarAnoATexto(libro.ano)
                                            ? `<span class="pill">${pasarAnoATexto(libro.ano)}</span>`
                                            : ''
                                        }
                                    </div>
                                </div>
                                <div class="nombreYMateriaContainer">
                                    <h1>${toUpperPrimeraLetra(libro.nombre)}</h1>
                                    ${libro.materia
                                        ? `<h2>${toUpperPrimeraLetra(libro.materia)}</h2>`
                                        : ''
                                    }
                                </div>
                                <h3>$${libro.precio}</h3>
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

// También escuchar radio buttons del nuevo diseño de filtros
const radioFiltros = document.querySelectorAll(
    'input[name="filtroMateria"], input[name="filtroAno"], input[name="filtroEstado"], input[name="filtroEditoriales"], input[name="filtroOrdenEstado"], input[name="filtroOrdenPrecio"]'
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

    const grupos = ['filtroMateria', 'filtroAno', 'filtroEstado', 'filtroEditoriales', 'filtroOrdenEstado', 'filtroOrdenPrecio']
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
                }, 200)
            }
        })
        chipsContainer.appendChild(chip)
    })

    // Precio
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
            }, 200)
        })
        chipsContainer.appendChild(chip)
    }
}

// Botón limpiar todos los filtros
const btnLimpiar = document.getElementById('btnLimpiarFiltros')

function actualizarEstadoBotonLimpiar() {
    if (!btnLimpiar) return
    const hayRadioActivo = ['filtroMateria', 'filtroAno', 'filtroEstado', 'filtroEditoriales', 'filtroOrdenEstado', 'filtroOrdenPrecio'].some(name => {
        const checked = document.querySelector(`input[name="${name}"]:checked`)
        return checked && checked.value !== ''
    })
    const precioMin = limpiarPrecio(document.getElementById('filtroPrecioMin')?.value ?? '')
    const precioMax = limpiarPrecio(document.getElementById('filtroPrecioMax')?.value ?? '')
    btnLimpiar.disabled = !hayRadioActivo && !precioMin && !precioMax
}

if (btnLimpiar) {
    btnLimpiar.addEventListener('click', () => {
        document.querySelectorAll('.filtro-opcion input[value=""]').forEach(r => r.checked = true)
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

// ===== TOGGLE SIDEBAR FILTROS =====
const btnToggleFiltros = document.getElementById('btnToggleFiltros')
const filtrosSidebar = document.querySelector('.filtros-sidebar')
const catalogoLayout = document.querySelector('.catalogo-layout')

if (btnToggleFiltros && filtrosSidebar) {
    btnToggleFiltros.addEventListener('click', () => {
        const isCollapsed = filtrosSidebar.classList.toggle('collapsed')
        catalogoLayout?.classList.toggle('sidebar-collapsed', isCollapsed)
        btnToggleFiltros.setAttribute('aria-expanded', isCollapsed ? 'false' : 'true')
        btnToggleFiltros.setAttribute('aria-label', isCollapsed ? 'Expandir filtros' : 'Colapsar filtros')
    })
}
