// chat.js — lógica del chat
// Las variables de sesión se inyectan desde Chat.cshtml via window.CHAT_CONFIG.

(function () {

    const DNI_USUARIO    = (window.CHAT_CONFIG && window.CHAT_CONFIG.dniUsuario)    || '';
    const DNI_VENDEDOR   = (window.CHAT_CONFIG && window.CHAT_CONFIG.dniVendedor)   || '';
    const TIENE_VENDEDOR = (window.CHAT_CONFIG && window.CHAT_CONFIG.tieneVendedor) || false;
    const DEFAULT_AVATAR = '/img/default.webp';

    let dniContactoActivo = DNI_VENDEDOR || null;

    // Cache de mensajes prefetcheados: { [dniContacto]: Mensaje[] }
    let cacheMensajes = {};

    // AbortController del fetch de mensajes en curso
    let abortControllerMensajes = null;

    // ── contenteditable: placeholder y foco ──────────────
    const input = document.getElementById('chatInput');
    if (input) {
        const range = document.createRange();
        const sel   = window.getSelection();
        range.selectNodeContents(input);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
        input.focus();

        function togglePlaceholder() {
            input.classList.toggle('chat-input--empty', input.textContent.trim() === '');
        }
        input.addEventListener('input', togglePlaceholder);
        togglePlaceholder();
    }

    // ── Buscar conversaciones (filtro cliente) ────────────
    const searchInput = document.getElementById('chatSearchInput');
    const convList    = document.getElementById('chatConvList');
    const noResults   = document.getElementById('chatSearchEmpty');

    if (searchInput && convList) {
        searchInput.addEventListener('input', function () {
            const q = this.value.trim().toLowerCase();
            // excluir skeletons del filtro
            const items = convList.querySelectorAll('.chat-conv-item:not(.chat-conv-item--skeleton)');
            let visible = 0;
            items.forEach(function (item) {
                const nombre = (item.dataset.nombre || '').toLowerCase();
                const match  = !q || nombre.includes(q);
                item.style.display = match ? '' : 'none';
                if (match) visible++;
            });
            if (noResults) noResults.hidden = visible > 0;
        });
    }

    // ── Helpers de renderizado ────────────────────────────
    function buildConvItem(chat, esActivo) {
        const avatar = chat.fotoPerfil
            ? `<img class="chat-conv-avatar" src="${chat.fotoPerfil}" alt="${chat.nombreComp}" />`
            : `<img class="chat-conv-avatar" src="${DEFAULT_AVATAR}" alt="${chat.nombreComp}" />`;

        const div = document.createElement('div');
        div.className      = 'chat-conv-item' + (esActivo ? ' chat-conv-item--active' : '');
        div.dataset.dni    = chat.idContacto;
        div.dataset.nombre = (chat.nombreComp || '').toLowerCase();
        div.innerHTML      = avatar
            + `<div class="chat-conv-meta">`
            +   `<span class="chat-conv-nombre">${chat.nombreComp || ''}</span>`
            + `</div>`;
        return div;
    }

    function buildMensajeEl(msg) {
        const esMio = msg.idEmisor === DNI_USUARIO;
        const div = document.createElement('div');
        div.className = 'chat-msg ' + (esMio ? 'chat-msg--outgoing' : 'chat-msg--incoming');
        div.innerHTML = `<div class="chat-msg-bubble">${escapeHtml(msg.contenido)}</div>`;
        return div;
    }

    function escapeHtml(str) {
        return str
            .replace(/&/g,  '&amp;')
            .replace(/</g,  '&lt;')
            .replace(/>/g,  '&gt;')
            .replace(/"/g,  '&quot;')
            .replace(/\n/g, '<br>');
    }

    // ── Cargar y renderizar el sidebar ────────────────────
    function cargarSidebar() {
        fetch('/Chat/ObtenerChats')
            .then(r => r.json())
            .then(function (chats) {
                // Quitar skeletons
                const sk1 = document.getElementById('chatSkeleton1');
                const sk2 = document.getElementById('chatSkeleton2');
                if (sk1) sk1.remove();
                if (sk2) sk2.remove();

                if (!chats || chats.length === 0) return;

                chats.forEach(function (chat) {
                    const esActivo = chat.idContacto === dniContactoActivo;
                    const item = buildConvItem(chat, esActivo);
                    item.addEventListener('click', function () {
                        abrirConversacion(chat.idContacto, chat.nombreComp, chat.fotoPerfil);
                    });
                    convList.appendChild(item);
                });
            })
            .catch(function (err) {
                console.error('[sidebar] Error:', err);
            });
    }

    // ── Prefetch: mensajes de los últimos 20 chats ────────
    // Se dispara al cargar la página. Llena la cache para que
    // al abrir cualquier chat los mensajes aparezcan instantáneamente.
    function prefetchMensajes() {
        fetch('/Chat/PrefetchMensajes')
            .then(r => r.json())
            .then(function (data) {
                // data es { "dniContacto": [...mensajes] }
                cacheMensajes = data || {};

                // Si ya hay un chat activo al entrar (vendedorDNI por query string),
                // renderizarlo ahora que tenemos los datos
                if (dniContactoActivo && cacheMensajes[dniContactoActivo] !== undefined) {
                    renderizarMensajes(dniContactoActivo, cacheMensajes[dniContactoActivo]);
                }
            })
            .catch(function (err) {
                console.error('[prefetch] Error:', err);
            });
    }

    // ── Renderizar mensajes en el body ────────────────────
    function renderizarMensajes(dniContacto, mensajes) {
        // Solo aplicar si el contacto sigue siendo el activo
        if (dniContacto !== dniContactoActivo) return;

        const body       = document.getElementById('chatMessagesBody');
        const emptyState = document.getElementById('chatEmptyState');
        const loader     = document.getElementById('chatMensajesLoader');
        if (!body) return;

        if (loader) loader.remove();
        Array.from(body.querySelectorAll('.chat-msg')).forEach(el => el.remove());

        if (!mensajes || mensajes.length === 0) {
            if (emptyState) emptyState.style.display = '';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        const frag = document.createDocumentFragment();
        mensajes.forEach(function (msg) { frag.appendChild(buildMensajeEl(msg)); });
        body.appendChild(frag);
        body.scrollTop = body.scrollHeight;
    }

    // ── Cargar mensajes de una conversación (con cache) ──
    // 1. Si hay cache, renderiza inmediatamente.
    // 2. Siempre hace fetch en background para actualizar con mensajes nuevos.
    // 3. Cancela el fetch anterior si se cambia de chat antes de que termine.
    function cargarMensajes(dniContacto) {
        const body   = document.getElementById('chatMessagesBody');
        const loader = document.getElementById('chatMensajesLoader');
        if (!body) return;

        // Cancelar fetch anterior
        if (abortControllerMensajes) {
            abortControllerMensajes.abort();
        }
        abortControllerMensajes = new AbortController();
        const signal = abortControllerMensajes.signal;

        // Si hay cache, renderizar ya
        if (cacheMensajes[dniContacto] !== undefined) {
            renderizarMensajes(dniContacto, cacheMensajes[dniContacto]);
        } else {
            // Sin cache: mostrar loader
            Array.from(body.querySelectorAll('.chat-msg')).forEach(el => el.remove());
            if (loader) loader.style.display = 'flex';
        }

        // Fetch en background (siempre, para traer mensajes nuevos)
        fetch('/Chat/ObtenerMensajes?dniContacto=' + encodeURIComponent(dniContacto), { signal })
            .then(r => r.json())
            .then(function (mensajes) {
                cacheMensajes[dniContacto] = mensajes;
                renderizarMensajes(dniContacto, mensajes);
            })
            .catch(function (err) {
                if (err.name === 'AbortError') return; // cambio de chat, ignorar
                console.error('[mensajes] Error:', err);
                if (loader) loader.style.display = 'none';
            });
    }

    // ── Abrir una conversación ────────────────────────────
    function abrirConversacion(dniContacto, nombreContacto, fotoContacto) {
        dniContactoActivo = dniContacto;

        // Marcar activo en el sidebar
        if (convList) {
            convList.querySelectorAll('.chat-conv-item').forEach(function (item) {
                item.classList.toggle('chat-conv-item--active', item.dataset.dni === dniContacto);
            });
        }

        // Actualizar header
        const header = document.getElementById('chatMessagesHeader');
        if (header) {
            const avatarSrc = fotoContacto || DEFAULT_AVATAR;
            header.innerHTML =
                `<button class="chat-back-btn" id="chatBackBtn" aria-label="Volver a conversaciones">`
                + `<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M15 6l-6 6l6 6"/></svg>`
                + `</button>`
                + `<img class="chat-conv-avatar" src="${avatarSrc}" alt="${nombreContacto || ''}" />`
                + `<div class="chat-messages-header-info">`
                +   `<p class="chat-messages-nombre">${nombreContacto || ''}</p>`
                + `</div>`;
            header.classList.add('chat-messages-header--clickable');

            const nuevoBackBtn = header.querySelector('.chat-back-btn');
            if (nuevoBackBtn) {
                nuevoBackBtn.addEventListener('click', function () {
                    document.querySelector('.chat-page')?.classList.remove('chat-page--panel-chat');
                });
            }
        }

        // Actualizar empty state
        const emptyTitle = document.querySelector('#chatEmptyState .chat-empty-title');
        const emptySub   = document.querySelector('#chatEmptyState .chat-empty-sub');
        if (emptyTitle) emptyTitle.textContent = 'Iniciá la conversación';
        if (emptySub)   emptySub.innerHTML = `Todavía no hay mensajes con <strong>${nombreContacto || ''}</strong>.<br/>¡Mandá el primero!`;

        // Mostrar input
        const inputWrap = document.getElementById('chatInputWrap');
        if (inputWrap) inputWrap.style.display = '';

        // Cargar mensajes (con cache + loader si hace falta)
        cargarMensajes(dniContacto);

        // Móvil: mostrar panel de mensajes
        const chatPage = document.querySelector('.chat-page');
        if (chatPage && window.innerWidth <= 600) {
            chatPage.classList.add('chat-page--panel-chat');
        }
    }

    // ── Enviar mensaje ────────────────────────────────────
    const sendBtn = document.getElementById('chatSendBtn');

    function enviarMensaje() {
        if (!dniContactoActivo || !input) return;
        const contenido = input.textContent.trim();
        if (!contenido) return;

        const body       = document.getElementById('chatMessagesBody');
        const emptyState = document.getElementById('chatEmptyState');
        const nuevoMsg   = { idEmisor: DNI_USUARIO, idReceptor: dniContactoActivo, contenido };
        const msgTemp    = buildMensajeEl(nuevoMsg);

        if (emptyState) emptyState.style.display = 'none';
        body.appendChild(msgTemp);
        body.scrollTop = body.scrollHeight;

        // Actualizar cache localmente
        if (!cacheMensajes[dniContactoActivo]) cacheMensajes[dniContactoActivo] = [];
        cacheMensajes[dniContactoActivo].push(nuevoMsg);

        input.innerHTML = '';
        input.classList.add('chat-input--empty');

        fetch('/Chat/EnviarMensaje', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ dniReceptor: dniContactoActivo, contenido })
        })
        .then(r => {
            if (!r.ok) throw new Error('Error al enviar');
            return r.json();
        })
        .catch(function (err) {
            console.error('[enviar] Error:', err);
            msgTemp.remove();
            // Revertir en cache
            const idx = cacheMensajes[dniContactoActivo]?.indexOf(nuevoMsg);
            if (idx > -1) cacheMensajes[dniContactoActivo].splice(idx, 1);
            if (body.querySelectorAll('.chat-msg').length === 0 && emptyState) {
                emptyState.style.display = '';
            }
        });
    }

    if (sendBtn) sendBtn.addEventListener('click', enviarMensaje);
    if (input) {
        input.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                enviarMensaje();
            }
        });
    }

    // ── Modal: nueva conversación ─────────────────────────
    const btnNuevo     = document.getElementById('chatNuevoBtn');
    const modalNuevo   = document.getElementById('chatNuevoModal');
    const modalOverlay = document.getElementById('chatNuevoOverlay');
    const modalClose   = document.getElementById('chatNuevoClose');
    const modalInput   = document.getElementById('chatNuevoSearchInput');
    const modalResults = document.getElementById('chatNuevoResults');

    const HINT_HTML = '<div class="chat-nuevo-hint">'
        + '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="M21 21l-4.35-4.35"/></svg>'
        + '<span>Escribí al menos 2 caracteres para buscar</span>'
        + '</div>';

    const EMPTY_HTML = '<div class="chat-nuevo-hint">'
        + '<svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><circle cx="12" cy="12" r="9"/><path d="M9 10h.01"/><path d="M15 10h.01"/><path d="M9.5 15.25a3.5 3.5 0 0 1 5 0"/></svg>'
        + '<span>Sin resultados para esa búsqueda</span>'
        + '</div>';

    function abrirModalNuevo() {
        if (!modalNuevo) return;
        modalNuevo.removeAttribute('hidden');
        if (modalResults) modalResults.innerHTML = HINT_HTML;
        if (modalInput)   { modalInput.value = ''; modalInput.focus(); }
    }

    function cerrarModalNuevo() {
        if (!modalNuevo) return;
        const dialog  = modalNuevo.querySelector('.chat-nuevo-dialog');
        const overlay = modalNuevo.querySelector('.chat-nuevo-overlay');
        if (dialog)  dialog.style.animation  = 'chatDialogOut 0.18s cubic-bezier(0.4,0,1,1) forwards';
        if (overlay) overlay.style.animation = 'chatOverlayOut 0.18s ease forwards';
        setTimeout(function () {
            modalNuevo.setAttribute('hidden', '');
            if (dialog)  dialog.style.animation  = '';
            if (overlay) overlay.style.animation = '';
        }, 170);
    }

    function buildResultItem(u) {
        const avatar = u.fotoPerfil
            ? `<img class="chat-nuevo-result-avatar" src="${u.fotoPerfil}" alt="${u.nombre}" />`
            : `<div class="chat-nuevo-result-avatar chat-nuevo-result-avatar--default"><svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg></div>`;

        let sub = '';
        if (u.ano)          sub += u.ano + '° año';
        if (u.especialidad) sub += (sub ? ' · ' : '') + u.especialidad;

        const item = document.createElement('div');
        item.className    = 'chat-nuevo-result-item';
        item.style.cursor = 'pointer';
        item.innerHTML = avatar
            + `<div class="chat-nuevo-result-info">`
            +   `<div class="chat-nuevo-result-nombre">${u.nombre}</div>`
            +   (sub ? `<div class="chat-nuevo-result-sub">${sub}</div>` : '')
            + `</div>`
            + `<svg class="chat-nuevo-result-arrow" xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>`;
        item.addEventListener('click', function () { agregarChat(u); });
        return item;
    }

    function agregarChat(u) {
        cerrarModalNuevo();

        const existente = convList && convList.querySelector(`.chat-conv-item[data-dni="${u.dni}"]`);
        if (existente) {
            abrirConversacion(u.dni, u.nombre, u.fotoPerfil);
            return;
        }

        const nuevoItem = buildConvItem(
            { idContacto: u.dni, nombreComp: u.nombre, fotoPerfil: u.fotoPerfil },
            true
        );
        nuevoItem.addEventListener('click', function () {
            abrirConversacion(u.dni, u.nombre, u.fotoPerfil);
        });
        if (convList) convList.insertBefore(nuevoItem, convList.firstChild);

        abrirConversacion(u.dni, u.nombre, u.fotoPerfil);

        fetch('/Chat/UpsertChat', {
            method:  'POST',
            headers: { 'Content-Type': 'application/json' },
            body:    JSON.stringify({ dniContacto: u.dni })
        });
    }

    let debounceTimer = null;
    function buscarUsuarios(q) {
        clearTimeout(debounceTimer);
        if (q.length < 2) { modalResults.innerHTML = HINT_HTML; return; }
        modalResults.innerHTML = '<div class="chat-nuevo-hint chat-nuevo-hint--loading">'
            + '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chat-nuevo-spinner"><path d="M12 3a9 9 0 1 0 9 9"/></svg>'
            + '</div>';
        debounceTimer = setTimeout(function () {
            fetch('/Chat/BuscarUsuarios?q=' + encodeURIComponent(q))
                .then(r => r.json())
                .then(function (data) {
                    if (!data || data.length === 0) { modalResults.innerHTML = EMPTY_HTML; return; }
                    modalResults.innerHTML = '';
                    data.forEach(u => modalResults.appendChild(buildResultItem(u)));
                })
                .catch(function () { modalResults.innerHTML = EMPTY_HTML; });
        }, 280);
    }

    if (modalInput)   modalInput.addEventListener('input', function () { buscarUsuarios(this.value.trim()); });
    if (btnNuevo)     btnNuevo.addEventListener('click', abrirModalNuevo);
    if (modalClose)   modalClose.addEventListener('click', cerrarModalNuevo);
    if (modalOverlay) modalOverlay.addEventListener('click', cerrarModalNuevo);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') cerrarModalNuevo(); });

    // ── Navegación por paneles (móvil ≤600px) ────────────
    const chatPage = document.querySelector('.chat-page');
    const backBtn  = document.getElementById('chatBackBtn');

    function esMobil() { return window.innerWidth <= 600; }

    if (esMobil() && TIENE_VENDEDOR) {
        chatPage && chatPage.classList.add('chat-page--panel-chat');
    }
    if (backBtn) {
        backBtn.addEventListener('click', function () {
            chatPage && chatPage.classList.remove('chat-page--panel-chat');
        });
    }
    window.addEventListener('resize', function () {
        if (!esMobil()) chatPage && chatPage.classList.remove('chat-page--panel-chat');
    });

    // ── Drawer del vendedor (mobile) ──────────────────────
    const vendedorOverlay = document.getElementById('chatVendedorOverlay');
    const vendedorDrawer  = document.getElementById('chatVendedorDrawer');
    const drawerContent   = document.getElementById('chatVendedorDrawerContent');
    const messagesHeader  = document.getElementById('chatMessagesHeader');
    const vendedorCard    = document.querySelector('.chat-col-vendedor .det-vendedor-card');

    function abrirDrawerVendedor() {
        if (!vendedorOverlay || !vendedorDrawer || !vendedorCard) return;
        drawerContent.innerHTML = '';
        drawerContent.appendChild(vendedorCard.cloneNode(true));
        vendedorOverlay.classList.add('chat-vendedor-overlay--visible');
        requestAnimationFrame(function () {
            vendedorOverlay.classList.add('chat-vendedor-overlay--animado');
            vendedorDrawer.classList.add('chat-vendedor-drawer--visible');
        });
        document.body.style.overflow = 'hidden';
    }

    function cerrarDrawerVendedor() {
        if (!vendedorOverlay || !vendedorDrawer) return;
        vendedorOverlay.classList.remove('chat-vendedor-overlay--animado');
        vendedorDrawer.classList.remove('chat-vendedor-drawer--visible');
        setTimeout(function () {
            vendedorOverlay.classList.remove('chat-vendedor-overlay--visible');
            document.body.style.overflow = '';
        }, 280);
    }

    if (messagesHeader && vendedorCard) {
        messagesHeader.addEventListener('click', function (e) {
            if (e.target.closest('#chatBackBtn')) return;
            abrirDrawerVendedor();
        });
    }
    if (vendedorOverlay) vendedorOverlay.addEventListener('click', cerrarDrawerVendedor);
    if (vendedorDrawer) {
        let touchStartY = 0;
        vendedorDrawer.addEventListener('touchstart', function (e) {
            touchStartY = e.touches[0].clientY;
        }, { passive: true });
        vendedorDrawer.addEventListener('touchend', function (e) {
            if (e.changedTouches[0].clientY - touchStartY > 60) cerrarDrawerVendedor();
        }, { passive: true });
    }

    // ── Modal avatar del vendedor ─────────────────────────
    const avatarChat     = document.getElementById('avatarVendedorChat');
    const avatarModal    = document.getElementById('chatAvatarModal');
    const avatarModalImg = document.getElementById('chatAvatarModalImg');

    if (avatarChat && avatarModal) {
        avatarChat.addEventListener('click', function (e) {
            e.stopPropagation();
            avatarModalImg.src = avatarChat.src;
            avatarModal.classList.add('open');
        });
        avatarModal.addEventListener('click', function () { avatarModal.classList.remove('open'); });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') avatarModal.classList.remove('open');
        });
    }

    // ── Inicialización ────────────────────────────────────
    cargarSidebar();
    prefetchMensajes();

    // Si hay vendedor activo al entrar, mostrar loader mientras llega el prefetch
    if (dniContactoActivo) {
        const body = document.getElementById('chatMessagesBody');
        const loader = document.getElementById('chatMensajesLoader');
        if (body && loader) loader.style.display = 'flex';
    }

})();
