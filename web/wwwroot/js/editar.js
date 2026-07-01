// ===== BOOK EDITAR (página que abre el modal) =====

document.addEventListener('DOMContentLoaded', async function () {
    var config = document.getElementById('editarPageConfig');
    if (!config) return;

    var publicacionId = config.dataset.publicacionId;
    var profileUrl = config.dataset.profileUrl;

    if (typeof abrirEditarModal === 'function' && publicacionId) {
        await abrirEditarModal(parseInt(publicacionId, 10));
    }

    var modal = document.getElementById('editarModal');
    if (!modal) return;

    function redirectToProfile() {
        modal.classList.remove('login-modal-overlay--visible');
        document.body.style.overflow = '';
        if (profileUrl) window.location.href = profileUrl;
    }

    window.cerrarEditarModal = function (e) {
        if (e && e.target !== modal) return;
        redirectToProfile();
    };

    var closeBtn = modal.querySelector('.login-modal-close');
    if (closeBtn) {
        closeBtn.onclick = function () {
            redirectToProfile();
        };
    }
});
