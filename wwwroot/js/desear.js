// ===== DESEAR: lógica del botón de favoritos =====

const svgDeseado = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="currentColor" class="icon icon-tabler icons-tabler-filled icon-tabler-heart"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M6.979 3.074a6 6 0 0 1 4.988 1.425l.037 .033l.034 -.03a6 6 0 0 1 4.733 -1.44l.246 .036a6 6 0 0 1 3.364 10.008l-.18 .185l-.048 .041l-7.45 7.379a1 1 0 0 1 -1.313 .082l-.094 -.082l-7.493 -7.422a6 6 0 0 1 3.176 -10.215z" /></svg>'
const svgNoDeseado = '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="icon icon-tabler icons-tabler-outline icon-tabler-heart"><path stroke="none" d="M0 0h24v24H0z" fill="none" /><path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572" /></svg>'

function obtenerSvgDeseado(esDeseado) {
    return esDeseado ? svgDeseado : svgNoDeseado
}

async function desearLibro(event, form) {
    event.preventDefault()
    event.stopPropagation()

    if (!form || !form.classList || !form.classList.contains('desearBtnForm')) return false

    const action = form.getAttribute('action') || '/Book/Desear'
    const btn = form.querySelector('button')
    const formData = new FormData(form)
    const tokenEl = form.querySelector('input[name="__RequestVerificationToken"]')
    const token = tokenEl ? tokenEl.value : null

    const estadoActualDeseado = btn ? btn.classList.contains('deseado') : false
    formData.set('esDeseado', estadoActualDeseado ? 'true' : 'false')

    try {
        const headers = token ? { 'RequestVerificationToken': token } : {}
        const res = await fetch(action, {
            method: 'POST',
            body: formData,
            headers
        })
        const data = await res.json().catch(() => null)
        if (data && data.success) {
            if (btn) {
                if (!btn.classList.contains('deseado')) {
                    btn.classList.add('deseado')
                    btn.innerHTML = svgDeseado
                } else {
                    btn.classList.remove('deseado')
                    btn.innerHTML = svgNoDeseado
                }
            }
        } else {
            console.error('Error al marcar como deseado', data)
        }
    } catch (err) {
        console.error('Error al enviar petición Desear:', err)
    }

    return false
}
