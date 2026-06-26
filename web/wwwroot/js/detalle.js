// ===== BOOK DETALLE =====

(function () {
    var avatar = document.getElementById('avatarVendedor');
    var modal = document.getElementById('avatarModal');
    var modalImg = document.getElementById('avatarModalImg');

    if (avatar && modal) {
        avatar.addEventListener('click', function () {
            modalImg.src = avatar.src;
            modal.classList.add('open');
        });
        modal.addEventListener('click', function () {
            modal.classList.remove('open');
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') modal.classList.remove('open');
        });
    }

    var svgFilled = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M6.979 3.074a6 6 0 0 1 4.988 1.425l.037 .033l.034 -.03a6 6 0 0 1 4.733 -1.44l.246 .036a6 6 0 0 1 3.364 10.008l-.18 .185l-.048 .041l-7.45 7.379a1 1 0 0 1 -1.313 .082l-.094 -.082l-7.493 -7.422a6 6 0 0 1 3.176 -10.215z"/></svg>';
    var svgOutline = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M19.5 12.572l-7.5 7.428l-7.5 -7.428a5 5 0 1 1 7.5 -6.566a5 5 0 1 1 7.5 6.572"/></svg>';

    var btnVisible = document.getElementById('btnFavoritoVisible');
    var form = document.querySelector('.det-fav-form');
    if (btnVisible && form) {
        var btnOculto = form.querySelector('button');
        btnVisible.addEventListener('click', async function () {
            if (btnVisible.disabled) return;
            btnVisible.disabled = true;
            var esDeseado = btnOculto.classList.contains('deseado');
            var formData = new FormData(form);
            formData.set('esDeseado', esDeseado ? 'true' : 'false');
            var token = form.querySelector('input[name="__RequestVerificationToken"]').value;
            try {
                var res = await fetch(form.getAttribute('action'), { method: 'POST', body: formData, headers: { 'RequestVerificationToken': token } });
                var data = await res.json();
                if (data && data.success) {
                    if (!esDeseado) {
                        btnOculto.classList.add('deseado'); btnOculto.innerHTML = svgFilled;
                        btnVisible.classList.add('det-btn-favorito--activo');
                        btnVisible.innerHTML = svgFilled + '<span>Quitar de favoritos</span>';
                        form.querySelector('input[name="esDeseado"]').value = 'true';
                    } else {
                        btnOculto.classList.remove('deseado'); btnOculto.innerHTML = svgOutline;
                        btnVisible.classList.remove('det-btn-favorito--activo');
                        btnVisible.innerHTML = svgOutline + '<span>Agregar a favoritos</span>';
                        form.querySelector('input[name="esDeseado"]').value = 'false';
                    }
                }
            } catch (e) { console.error(e); }
            finally { btnVisible.disabled = false; }
        });
    }

    var overlay = document.getElementById('intercambioOverlay');
    var btnAbrir = document.getElementById('btnConsultarPublicacion');
    var btnCerrar = document.getElementById('intercambioClose');

    function abrirModal() {
        overlay.classList.add('intercambio-overlay--visible');
        overlay.setAttribute('aria-hidden', 'false');
        document.body.style.overflow = 'hidden';
    }

    function cerrarModal() {
        overlay.classList.remove('intercambio-overlay--visible');
        overlay.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    if (btnAbrir) btnAbrir.addEventListener('click', abrirModal);
    if (btnCerrar) btnCerrar.addEventListener('click', cerrarModal);
    if (overlay) overlay.addEventListener('click', function (e) {
        if (e.target === overlay) cerrarModal();
    });
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') cerrarModal();
    });

    var ctaBtn = document.getElementById('intercambioCta');
    document.querySelectorAll('.intercambio-item').forEach(function (item) {
        item.addEventListener('click', function () {
            item.classList.toggle('intercambio-item--seleccionado');
            var haySeleccionado = document.querySelectorAll('.intercambio-item--seleccionado').length > 0;
            if (ctaBtn) ctaBtn.disabled = !haySeleccionado;
        });
    });
})();
