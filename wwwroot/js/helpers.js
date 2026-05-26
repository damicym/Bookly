// ===== HELPERS: funciones utilitarias compartidas =====

function pasarAnoATexto(ano) {
    switch(ano) {
        case 1: return "7mo"
        case 2: return "1ero"
        case 3: return "2ndo"
        case 4: return "3ero"
        case 5: return "4to"
        case 6: return "5to"
        default: return "Desconocido"
    }
}

function toUpperPrimeraLetra(texto) {
    if (!texto) return texto
    return texto.split(' ').map(palabra => palabra.charAt(0).toUpperCase() + palabra.slice(1).toLowerCase()).join(' ')
}

function limpiarPrecio(valor) {
    return (valor ?? "").toString().replace(/\D/g, "")
}

function formatearMiles(valor) {
    const soloDigitos = limpiarPrecio(valor)
    if (!soloDigitos) return ""
    return soloDigitos.replace(/\B(?=(\d{3})+(?!\d))/g, ".")
}

function getColor(estado) {
    switch(estado) {
        case "Como nuevo":        return "var(--secondary2)"
        case "Pocas anotaciones": return "var(--accent)"
        case "Muy anotado":       return "var(--red2)"
        default: return "white"
    }
}
