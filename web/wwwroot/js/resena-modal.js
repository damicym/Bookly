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

        // Reset sección problema
        var toggleProblema = overlay.querySelector('#resenaProblemaToggle');
        var detalle = overlay.querySelector('#resenaProblemaDetalle');
        var taProb  = overlay.querySelector('#resenaProblema');
        if (toggleProblema) toggleProblema.setAttribute('aria-expanded', 'false');
        if (detalle) detalle.classList.remove('resena-problema-detalle--abierto');
        if (taProb) taProb.value = '';

        // Reset sección comentario
        var toggleComentario = overlay.querySelector('#resenaComentarioToggle');
        var detalleComentario = overlay.querySelector('#resenaComentarioDetalle');
        var taComentario = overlay.querySelector('#resenaComentario');
        if (toggleComentario) toggleComentario.setAttribute('aria-expanded', 'false');
        if (detalleComentario) detalleComentario.classList.remove('resena-problema-detalle--abierto');
        if (taComentario) taComentario.value = '';
        var err = overlay.querySelector('.resena-error');
        if (err) err.classList.remove('resena-error--visible');

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

        // Submit
        var form = overlay.querySelector('#resenaForm');
        if (!form) return;

        form.addEventListener('submit', async function (e) {
            e.preventDefault();

            var idResena  = (overlay.querySelector('#resenaIdInput')?.value || '').trim();
            var at2  = form.querySelector('input[name="at2"]:checked')?.value;
            var at3  = form.querySelector('input[name="at3"]:checked')?.value;
            var en1  = form.querySelector('input[name="en1"]:checked')?.value;
            var en2  = form.querySelector('input[name="en2"]:checked')?.value;
            var err       = overlay.querySelector('.resena-error');
            var btn       = overlay.querySelector('.resena-submit-btn');

            // Validación — solo at2 y en1 son obligatorias; en2 y at3 son opcionales
            if (!at2 || !en1) {
                if (err) {
                    err.textContent = 'Respondé las preguntas de Atención y Entrega antes de enviar.';
                    err.classList.add('resena-error--visible');
                }
                return;
            }

            // Calcular promedio redondeado por eje (en2 y at3 son opcionales)
            var atencion = at3
                ? Math.round((parseInt(at2) + parseInt(at3)) / 2)
                : parseInt(at2);
            var entrega = en2
                ? Math.round((parseInt(en1) + parseInt(en2)) / 2)
                : parseInt(en1);

            if (err) err.classList.remove('resena-error--visible');
            btn.disabled = true;
            btn.textContent = 'Enviando…';

            // TODO: conectar con base de datos
            // Mostrar animación de éxito directamente
            var formBody = overlay.querySelector('.resena-body');
            var resenaFooter = overlay.querySelector('.resena-footer');
            var success  = overlay.querySelector('.resena-success');
            if (formBody) formBody.style.display = 'none';
            if (resenaFooter) resenaFooter.style.display = 'none';
            if (success)  success.classList.add('resena-success--visible');

            // Cerrar automáticamente después de 2.8s
            setTimeout(_cerrar, 2800);
        });
    });

})();
