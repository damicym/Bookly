// ===== USUARIOS LOGIN (página que abre el modal) =====

document.addEventListener('DOMContentLoaded', function () {
    var errEl = document.getElementById('loginServerError');
    if (errEl) {
        var modalErr = document.getElementById('loginModalError');
        if (modalErr) {
            modalErr.textContent = errEl.textContent;
            modalErr.style.display = 'block';
        }
    }
    if (typeof abrirLoginModal === 'function') abrirLoginModal();
});
