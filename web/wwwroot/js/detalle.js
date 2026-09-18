// ===== BOOK DETALLE =====

(function () {

    // ── Widget vendedor — carga progresiva ────────────────
    var colVendedor = document.getElementById('detalleColVendedor');

    if (colVendedor) {
        var dniVendedor = colVendedor.dataset.dni        || '';
        var excluirId   = colVendedor.dataset.excluirId  || '';
        var enc         = encodeURIComponent(dniVendedor);

        // SVG inline (mismos que en chat.js)
        var SVG_CHAT    = "<svg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M8 9h8'/><path d='M8 13h6'/><path d='M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z'/></svg>";
        var SVG_CLOCK   = "<svg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><circle cx='12' cy='12' r='9'/><path d='M12 7v5l2.5 2.5'/></svg>";
        var SVG_OK      = "<svg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='#22c55e' stroke='none'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-1.293 5.953a1 1 0 0 0 -1.32 -.083l-.094 .083l-3.293 3.292l-1.293 -1.292l-.094 -.083a1 1 0 0 0 -1.403 1.403l.083 .094l2 2l.094 .083a1 1 0 0 0 1.226 0l.094 -.083l4 -4l.083 -.094a1 1 0 0 0 -.083 -1.32z'/></svg>";
        var SVG_NEUTRAL = "<svg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='#64748b' stroke='none'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336z'/><rect x='7' y='10.75' width='10' height='2.5' rx='1.25' fill='white'/></svg>";
        var SVG_WARN    = "<svg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='#f59e0b' stroke='none'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M12 1.67c.955 0 1.845 .467 2.39 1.247l.105 .16l8.114 13.548a2.928 2.928 0 0 1 -2.307 4.363l-.195 .008h-16.225a2.928 2.928 0 0 1 -2.582 -4.2l.099 -.185l8.11 -13.539a2.928 2.928 0 0 1 2.491 -1.402zm0 10.33a1 1 0 0 0 -1 1v2a1 1 0 0 0 2 0v-2a1 1 0 0 0 -1 -1zm0 -4a1 1 0 0 0 0 2a1 1 0 0 0 0 -2z'/></svg>";

        function escHtml(s) {
            return String(s || '')
                .replace(/&/g,'&amp;').replace(/</g,'&lt;')
                .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
        }

        // ── PASO 1 + 2: info básica y reseñas (paralelo, se combinan para stats) ──
        var infoData    = null;
        var resenasData = null;

        function renderTopConInfo(info) {
            var avatar = escHtml(info.fotoPerfil || '/img/default.webp');
            var nombre = escHtml(info.nombreComp || '');
            var anoTxt = info.anoTexto || '';
            var espec  = escHtml(info.especialidad || '');
            var curso  = escHtml(info.curso || '');
            var about  = escHtml(info.aboutMe || '');

            var subParts = [];
            if (anoTxt)         subParts.push(anoTxt);
            if (espec || curso) subParts.push([espec, curso].filter(Boolean).join(' '));
            var sub = subParts.join(' · ');

            var topEl = document.getElementById('vskTop');
            if (topEl) {
                topEl.className = 'det-vendedor-top';
                topEl.innerHTML =
                    '<img src="' + avatar + '" alt="perfil" class="det-vendedor-avatar" id="avatarVendedor" style="cursor:pointer" title="Ver foto" />'
                    + '<div>'
                    +   '<span class="det-vendedor-pill">Vendedor</span>'
                    +   '<p class="det-vendedor-nombre">' + nombre + '</p>'
                    +   '<p class="det-vendedor-sub">' + sub + '</p>'
                    +   (about ? '<p class="det-vendedor-about">' + about + '</p>' : '')
                    + '</div>';
                var ctaWrap = document.getElementById('vskCta');
                if (ctaWrap) ctaWrap.style.display = '';
                rewireAvatarVendedor();
            }
        }

        function renderStats() {
            if (!infoData || !resenasData) return;
            var statsEl = document.getElementById('vskStats');
            if (!statsEl) return;

            var ventasCerradas = infoData.ventasCerradas || 0;
            var ventasStr = ventasCerradas >= 10
                ? (Math.floor(ventasCerradas / 10) * 10) + '+'
                : String(ventasCerradas);

            var count  = resenasData.resenaCount || 0;
            var pAten  = resenasData.promedioAtencion;
            var pEntr  = resenasData.promedioEntrega;

            var segActivo = 0;
            if (pAten != null && pEntr != null) {
                var g = Math.round((pAten + pEntr) / 2);
                segActivo = Math.max(1, Math.min(5, g));
            }
            function segCls(n) { return segActivo === n ? 'det-rep-seg--activo' : ''; }

            var atenLabel = '', atenIcon = '', atenBadge = '';
            if (pAten != null) {
                if (pAten <= 5/3)      { atenLabel = 'Mala atención';    atenIcon = SVG_CHAT;  atenBadge = SVG_WARN; }
                else if (pAten <= 10/3){ atenLabel = 'Atención regular'; atenIcon = SVG_CHAT;  atenBadge = SVG_NEUTRAL; }
                else                   { atenLabel = 'Buena atención';   atenIcon = SVG_CHAT;  atenBadge = SVG_OK; }
            }
            var entrLabel = '', entrIcon = '', entrBadge = '';
            if (pEntr != null) {
                if (pEntr <= 5/3)      { entrLabel = 'No entrega a tiempo'; entrIcon = SVG_CLOCK; entrBadge = SVG_WARN; }
                else if (pEntr <= 10/3){ entrLabel = 'Entrega irregular';   entrIcon = SVG_CLOCK; entrBadge = SVG_NEUTRAL; }
                else                   { entrLabel = 'Entrega a tiempo';    entrIcon = SVG_CLOCK; entrBadge = SVG_OK; }
            }

            var countLabel = count === 1 ? '1 reseña' : count + ' reseñas';
            var extra = '';
            if (count > 0) {
                extra = '<div class="det-rep-divider"></div>'
                    + '<div class="det-rep-stat"><div class="det-rep-stat-icon-wrap">' + atenIcon + '<span class="det-rep-check">' + atenBadge + '</span></div><span class="det-rep-stat-desc">' + atenLabel + '</span></div>'
                    + '<div class="det-rep-divider"></div>'
                    + '<div class="det-rep-stat"><div class="det-rep-stat-icon-wrap">' + entrIcon + '<span class="det-rep-check">' + entrBadge + '</span></div><span class="det-rep-stat-desc">' + entrLabel + '</span></div>';
            }

            statsEl.className = 'det-vendedor-stats-widget';
            statsEl.innerHTML =
                '<span class="det-rep-resena-count">(' + countLabel + ')</span>'
                + '<div class="det-rep-barra-segmentada">'
                +   '<div class="det-rep-seg det-rep-seg-1 ' + segCls(1) + '"></div>'
                +   '<div class="det-rep-seg det-rep-seg-2 ' + segCls(2) + '"></div>'
                +   '<div class="det-rep-seg det-rep-seg-3 ' + segCls(3) + '"></div>'
                +   '<div class="det-rep-seg det-rep-seg-4 ' + segCls(4) + '"></div>'
                +   '<div class="det-rep-seg det-rep-seg-5 ' + segCls(5) + '"></div>'
                + '</div>'
                + '<div class="det-rep-stats-row">'
                +   '<div class="det-rep-stat det-rep-stat--ventas"><span class="det-rep-stat-num">' + ventasStr + '</span><span class="det-rep-stat-desc">ventas</span></div>'
                +   extra
                + '</div>';
        }

        fetch('/Book/ObtenerInfoVendedor?dniVendedor=' + enc)
            .then(function (r) { return r.json(); })
            .then(function (info) {
                if (!info) return;
                infoData = info;
                renderTopConInfo(info);
                renderStats(); // por si las reseñas ya llegaron
            })
            .catch(function (e) { console.error('[detalle/info]', e); });

        fetch('/Book/ObtenerResenasVendedor?dniVendedor=' + enc)
            .then(function (r) { return r.json(); })
            .then(function (res) {
                resenasData = res;
                renderStats(); // por si la info ya llegó
            })
            .catch(function (e) { console.error('[detalle/resenas]', e); });

        // ── PASO 3: publicaciones ──────────────────────────
        fetch('/Book/ObtenerPublicacionesVendedor?dniVendedor=' + enc + '&excluirId=' + encodeURIComponent(excluirId))
            .then(function (r) { return r.json(); })
            .then(function (data) {
                var pubsEl = document.getElementById('vskPubs');
                if (!pubsEl) return;
                var activas = data.activas || 0;
                var lista   = data.publicaciones || [];

                var labelCount = activas > 0
                    ? 'Publicaciones <span class="det-otras-count">(' + activas + ')</span>'
                    : 'Publicaciones';

                var grid = '';
                if (lista.length === 0) {
                    grid = '<p class="det-otras-empty">Este usuario no publicó ningún libro todavía.</p>';
                } else {
                    lista.forEach(function (p) {
                        var img  = escHtml(p.imagen || '/img/book-placeholder.webp');
                        var nom  = escHtml(p.nombre || '');
                        var prec = escHtml(String(p.precio || ''));
                        grid += '<a class="det-otras-thumb" href="/Book/Detalle/' + p.id + '">'
                            + '<img src="' + img + '" alt="' + nom + '" loading="lazy" />'
                            + '<div class="det-otras-thumb-info">'
                            +   '<span class="det-otras-thumb-nombre">' + nom + '</span>'
                            +   '<span class="det-otras-thumb-precio">$' + prec + '</span>'
                            + '</div>'
                            + '</a>';
                    });
                }

                pubsEl.className = 'det-otras';
                pubsEl.innerHTML = '<span class="det-otras-label">' + labelCount + '</span>'
                    + '<div class="det-otras-grid">' + grid + '</div>';
            })
            .catch(function (e) { console.error('[detalle/pubs]', e); });
    }

    // ── Modal avatar del vendedor ──────────────────────────
    var modal    = document.getElementById('avatarModal');
    var modalImg = document.getElementById('avatarModalImg');

    function rewireAvatarVendedor() {
        var avatar = document.getElementById('avatarVendedor');
        if (avatar && modal && modalImg) {
            avatar.onclick = function () {
                modalImg.src = avatar.src;
                modalImg.classList.remove('avatar-modal-img--portada');
                modal.classList.add('open');
            };
        }
    }

    if (modal) {
        modal.addEventListener('click', function (e) {
            if (e.target === modal) modal.classList.remove('open');
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') modal.classList.remove('open');
        });
    }

    // Portada del libro
    var portada = document.getElementById('portadaLibro');
    if (portada && modal) {
        portada.addEventListener('click', function () {
            modalImg.src = portada.src;
            modalImg.classList.add('avatar-modal-img--portada');
            modal.classList.add('open');
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

    if (ctaBtn) {
        ctaBtn.addEventListener('click', function () {
            var chatUrl = ctaBtn.dataset.chatUrl;
            if (chatUrl) window.location.href = chatUrl;
        });
    }
})();
