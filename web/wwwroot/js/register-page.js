// ===== USUARIOS REGISTER (página que abre el modal) =====

document.addEventListener('DOMContentLoaded', function () {
    var errEl = document.getElementById('registerServerError');
    if (errEl) {
        var modalErr = document.getElementById('registerModalError');
        if (modalErr) {
            modalErr.textContent = errEl.textContent;
            modalErr.style.display = 'block';
        }
    }
    if (typeof abrirRegisterModal === 'function') abrirRegisterModal();
});
