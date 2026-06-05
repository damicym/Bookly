console.log("entra a js")

// Variable global usada por buscar.js y profile.js
const searchInput = document.getElementById("searchInput")

// ===== UTILIDAD: deshabilitar/habilitar botón con estado de carga =====
function setButtonLoading(btn, loading) {
    if (!btn) return;
    if (loading) {
        btn.disabled = true;
        if (!btn.dataset.originalHtml) btn.dataset.originalHtml = btn.innerHTML;
        btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="animation:spin .7s linear infinite"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M12 3a9 9 0 1 0 9 9"/></svg> Cargando...`;
    } else {
        btn.disabled = false;
        if (btn.dataset.originalHtml) {
            btn.innerHTML = btn.dataset.originalHtml;
            delete btn.dataset.originalHtml;
        }
    }
}
