// ===== MODAL DE RESEÑA =====

(function () {

    // ── Apertura ──────────────────────────────────────────────────
    window.abrirResenaModal = function (idResena, nombreVendedor, avatarVendedor) {
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

        // Guardar el id de la reseña en el form
        var idInput = overlay.querySelector('#resenaIdInput');
        if (idInput) idInput.value = idResena || '';

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

        // Limpiar comentario
        var comentario = overlay.querySelector('#resenaComentario');
        if (comentario) comentario.value = '';

        // Reset sección problema
        var toggleProblema = overlay.querySelector('#resenaProblemaToggle');
        var detalle = overlay.querySelector('#resenaProblemaDetalle');
        var taProb  = overlay.querySelector('#resenaProblema');
        if (toggleProblema) toggleProblema.setAttribute('aria-expanded', 'false');
        if (detalle) detalle.classList.remove('resena-problema-detalle--abierto');
        if (taProb) taProb.value = '';

        // Ocultar error
        var err = overlay.querySelector('.resena-error');
        if (err) err.classList.remove('resena-error--visible');

        // Mostrar form, ocultar éxito
        var form = overlay.querySelector('.resena-body');
        var success = overlay.querySelector('.resena-success');
        if (form) form.style.display = '';
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

        // Submit
        var form = overlay.querySelector('#resenaForm');
        if (!form) return;

        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            var idResena  = (overlay.querySelector('#resenaIdInput')?.value || '').trim();
            var at1  = form.querySelector('input[name="at1"]:checked')?.value;
            var at2  = form.querySelector('input[name="at2"]:checked')?.value;
            var en1  = form.querySelector('input[name="en1"]:checked')?.value;
            var en2  = form.querySelector('input[name="en2"]:checked')?.value;
            var err       = overlay.querySelector('.resena-error');
            var btn       = overlay.querySelector('.resena-submit-btn');

            // Validación — las 4 preguntas son obligatorias
            if (!at1 || !at2 || !en1 || !en2) {
                if (err) {
                    err.textContent = 'Respondé las cuatro preguntas antes de enviar.';
                    err.classList.add('resena-error--visible');
                }
                return;
            }

            // Calcular promedio redondeado por eje
            var atencion = Math.round((parseInt(at1) + parseInt(at2)) / 2);
            var entrega  = Math.round((parseInt(en1) + parseInt(en2)) / 2);

            if (err) err.classList.remove('resena-error--visible');
            btn.disabled = true;
            btn.textContent = 'Enviando…';

            try {
                var token = document.querySelector('input[name="__RequestVerificationToken"]')?.value;
                var res = await fetch('/Resenas/Enviar', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'RequestVerificationToken': token || ''
                    },
                    body: JSON.stringify({
                        id:         parseInt(idResena),
                        atencion:   atencion,
                        entrega:    entrega,
                        comentario: (overlay.querySelector('#resenaComentario')?.value || '').trim(),
                        problema:   (overlay.querySelector('#resenaProblema')?.value || '').trim()
                    })
                });

                var data = await res.json().catch(() => null);

                if (res.ok && data?.success) {
                    // Mostrar estado de éxito
                    var formBody = overlay.querySelector('.resena-body');
                    var success  = overlay.querySelector('.resena-success');
                    if (formBody) formBody.style.display = 'none';
                    if (success)  success.classList.add('resena-success--visible');

                    // Cerrar automáticamente después de 2.2s
                    setTimeout(_cerrar, 2200);
                } else {
                    throw new Error(data?.message || 'Error al enviar');
                }
            } catch (ex) {
                btn.disabled = false;
                btn.textContent = 'Enviar reseña';
                if (err) {
                    err.textContent = 'Hubo un error al enviar la reseña. Intentá de nuevo.';
                    err.classList.add('resena-error--visible');
                }
                console.error('Reseña error:', ex);
            }
        });
    });

})();
