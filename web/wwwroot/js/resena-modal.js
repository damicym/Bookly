// ===== MODAL DE RESEÑA =====

(function () {

    // ── Apertura ──────────────────────────────────────────────────
    window.abrirResenaModal = function (idReceptor, nombreVendedor, avatarVendedor) {
        var overlay = document.getElementById('resenaModal');
        if (!overlay) return;

        // Cerrar el panel de notificaciones si está abierto
        var notifPanel = document.getElementById('notifPanel');
        if (notifPanel) notifPanel.classList.remove('notif-panel--visible');

        // Cargar datos del vendedor en el header
        var avatarEl = overlay.querySelector('.resena-header-avatar');
        var tituloEl = overlay.querySelector('.resena-header-titulo');
        if (avatarEl) avatarEl.src = avatarVendedor || '/img/default.webp';
        if (tituloEl) tituloEl.textContent = nombreVendedor || 'Vendedor';

        // Guardar el DNI del receptor en el form
        var idInput = overlay.querySelector('#resenaIdInput');
        if (idInput) idInput.value = idReceptor || '';

        // Reset estado
        _resetModal();

        // Abrir
        overlay.classList.add('resena-overlay--visible');
        document.body.style.overflow = 'hidden';
    };

    // ── Cierre ────────────────────────────────────────────────────
    window.cerrarResenaModal = function (e) {
        if (e && e.target !== document.getElementById('resenaModal')) return;
        _cerrar();
    };

    function _cerrar() {
        var overlay = document.getElementById('resenaModal');
        if (!overlay) return;
        overlay.classList.remove('resena-overlay--visible');
        document.body.style.overflow = '';
    }

    // ── Reset interno ─────────────────────────────────────────────
    function _resetModal() {
        var overlay = document.getElementById('resenaModal');
        if (!overlay) return;

        // Limpiar radios
        overlay.querySelectorAll('input[type="radio"]').forEach(function (r) {
            r.checked = false;
        });

        // Reset sección problema
        var toggleProblema = overlay.querySelector('#resenaProblemaToggle');
        var detalle = overlay.querySelector('#resenaProblemaDetalle');
        var taProb  = overlay.querySelector('#resenaProblema');
        if (toggleProblema) toggleProblema.setAttribute('aria-expanded', 'false');
        if (detalle) detalle.classList.remove('resena-problema-detalle--abierto');
        if (taProb) taProb.value = '';

        // Mostrar form, ocultar éxito
        var form = overlay.querySelector('.resena-body');
        var resenaFooter = overlay.querySelector('.resena-footer');
        var success = overlay.querySelector('.resena-success');
        if (form) form.style.display = '';
        if (resenaFooter) resenaFooter.style.display = '';
        if (success) success.classList.remove('resena-success--visible');

        // Reset botón
        var btn = overlay.querySelector('.resena-submit-btn');
        if (btn) { btn.disabled = false; btn.textContent = 'Enviar reseña'; }
    }

    // ── Init ──────────────────────────────────────────────────────
    document.addEventListener('DOMContentLoaded', function () {
        var overlay = document.getElementById('resenaModal');
        if (!overlay) return;

        // Cerrar con Escape
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') _cerrar();
        });

        // ── Toggle problema ────────────────────────────────────
        var toggleProblema = overlay.querySelector('#resenaProblemaToggle');
        var detalle        = overlay.querySelector('#resenaProblemaDetalle');

        if (toggleProblema && detalle) {
            toggleProblema.addEventListener('click', function () {
                var abierto = toggleProblema.getAttribute('aria-expanded') === 'true';
                if (abierto) {
                    toggleProblema.setAttribute('aria-expanded', 'false');
                    detalle.classList.remove('resena-problema-detalle--abierto');
                    var ta = detalle.querySelector('textarea');
                    if (ta) ta.value = '';
                } else {
                    toggleProblema.setAttribute('aria-expanded', 'true');
                    detalle.classList.add('resena-problema-detalle--abierto');
                    setTimeout(function () {
                        var ta = detalle.querySelector('textarea');
                        if (ta) ta.focus();
                    }, 50);
                }
            });
        }

        // ── Toggle comentario ──────────────────────────────────
        var toggleComentario = overlay.querySelector('#resenaComentarioToggle');
        var detalleComentario = overlay.querySelector('#resenaComentarioDetalle');

        if (toggleComentario && detalleComentario) {
            toggleComentario.addEventListener('click', function () {
                var abierto = toggleComentario.getAttribute('aria-expanded') === 'true';
                if (abierto) {
                    toggleComentario.setAttribute('aria-expanded', 'false');
                    detalleComentario.classList.remove('resena-problema-detalle--abierto');
                    var ta = detalleComentario.querySelector('textarea');
                    if (ta) ta.value = '';
                } else {
                    toggleComentario.setAttribute('aria-expanded', 'true');
                    detalleComentario.classList.add('resena-problema-detalle--abierto');
                    setTimeout(function () {
                        var ta = detalleComentario.querySelector('textarea');
                        if (ta) ta.focus();
                    }, 50);
                }
            });
        }

        // ── Submit ─────────────────────────────────────────────
        var form = overlay.querySelector('#resenaForm');
        if (!form) return;

        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            var idReceptor = (overlay.querySelector('#resenaIdInput')?.value || '').trim();
            var at2 = form.querySelector('input[name="at2"]:checked')?.value;
            var at3 = form.querySelector('input[name="at3"]:checked')?.value;
            var en1 = form.querySelector('input[name="en1"]:checked')?.value;
            var en2 = form.querySelector('input[name="en2"]:checked')?.value;
            var err = overlay.querySelector('.resena-error');
            var btn = overlay.querySelector('.resena-submit-btn');

            // Todas las caritas son obligatorias
            if (!at2 || !en1 || !en2 || !at3) {
                if (err) {
                    err.textContent = 'Tenés que seleccionar todas las caritas antes de enviar.';
                    err.classList.add('resena-error--visible');
                }
                return;
            }

            // at2 → atencion, en1+en2 promedio → entrega, en2 → responsable, at3 → proceso
            var atencion    = parseInt(at2);
            var entrega     = Math.round((parseInt(en1) + parseInt(en2)) / 2);
            var responsable = parseInt(en2);
            var proceso     = parseInt(at3);

            if (err) err.classList.remove('resena-error--visible');
            btn.disabled = true;
            btn.textContent = 'Enviando…';

            var problema   = (overlay.querySelector('#resenaProblema')?.value   || '').trim();
            var comentario = (overlay.querySelector('#resenaComentario')?.value || '').trim();

            try {
                var token = document.querySelector('input[name="__RequestVerificationToken"]')?.value;
                var resp = await fetch('/Resena/Enviar', {
                    method:  'POST',
                    headers: {
                        'Content-Type':             'application/json',
                        'RequestVerificationToken': token || ''
                    },
                    body: JSON.stringify({
                        id_receptor: idReceptor,
                        atencion:    atencion,
                        entrega:     entrega,
                        responsable: responsable,
                        proceso:     proceso,
                        comentario:  comentario || null,
                        problema:    problema   || null
                    })
                });

                if (!resp.ok) {
                    var errData = await resp.json().catch(function () { return {}; });
                    throw new Error(errData.message || 'Error al guardar la reseña');
                }

                // Mostrar animación de éxito
                var formBody = overlay.querySelector('.resena-body');
                var resenaFooter = overlay.querySelector('.resena-footer');
                var success = overlay.querySelector('.resena-success');
                if (formBody) formBody.style.display = 'none';
                if (resenaFooter) resenaFooter.style.display = 'none';
                if (success) success.classList.add('resena-success--visible');

                // Cerrar automáticamente después de 2.8s
                setTimeout(_cerrar, 2800);

            } catch (fetchErr) {
                btn.disabled = false;
                btn.textContent = 'Enviar reseña';
                if (err) {
                    err.textContent = fetchErr.message || 'No se pudo guardar la reseña. Intentá de nuevo.';
                    err.classList.add('resena-error--visible');
                }
            }
        });
    });

})();
