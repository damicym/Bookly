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

    // Borradores por chat: { [dniContacto]: innerHTML }
    // Se guarda el contenido del input al cambiar de conversación
    // y se restaura al volver a esa conversación.
    const borradores = {};

    // AbortController del fetch de mensajes en curso
    let abortControllerMensajes = null;

    // ── contenteditable: placeholder y foco ──────────────
    const input = document.getElementById('chatInput');

    // Devuelve true si el contenteditable está vacío (solo espacios/saltos/brs)
    function inputEsVacio() {
        if (!input) return true;
        // Clonar para limpiar sin afectar el DOM
        const clone = input.cloneNode(true);
        // Reemplazar <br> por nada para que no cuenten como contenido
        clone.querySelectorAll('br').forEach(function (br) { br.remove(); });
        // Cubrir &nbsp; (U+00A0), zero-width space (U+200B) y BOM (U+FEFF)
        return clone.textContent.replace(/[\u00A0\u200B\uFEFF]/g, ' ').trim() === '';
    }

    function togglePlaceholder() {
        if (!input) return;
        input.classList.toggle('chat-input--empty', inputEsVacio());
    }

    if (input) {
        const range = document.createRange();
        const sel   = window.getSelection();
        range.selectNodeContents(input);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);
        input.focus();

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

    // Muestra u oculta la línea de borrador debajo del nombre en el sidebar.
    // textoPlano: contenido del borrador (sin HTML), o null para ocultar.
    function actualizarBorradorEnSidebar(dniContacto, textoPlano) {
        if (!convList) return;
        const item = convList.querySelector(`.chat-conv-item[data-dni="${dniContacto}"]`);
        if (!item) return;
        const meta = item.querySelector('.chat-conv-meta');
        if (!meta) return;

        // Quitar preview anterior si existe
        const prevPreview = meta.querySelector('.chat-conv-preview');
        if (prevPreview) prevPreview.remove();

        if (textoPlano && textoPlano.trim() !== '') {
            const preview = document.createElement('span');
            preview.className = 'chat-conv-preview chat-conv-preview--borrador';
            // Escapar para evitar XSS — solo texto plano
            preview.innerHTML =
                `<span class="chat-conv-draft-label">Borrador:</span> `
                + escapeHtml(textoPlano.trim());
            meta.appendChild(preview);
        }
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
        // Guardar borrador del chat actual antes de cambiar
        if (input && dniContactoActivo) {
            // Extraer texto plano del borrador (sin HTML, sin <br>, sin &nbsp;)
            const clone = input.cloneNode(true);
            clone.querySelectorAll('br').forEach(function (br) { br.remove(); });
            const textoBorrador = clone.textContent.replace(/\u00A0/g, ' ').trim();

            if (textoBorrador !== '') {
                borradores[dniContactoActivo] = input.innerHTML;
                actualizarBorradorEnSidebar(dniContactoActivo, textoBorrador);
            } else {
                // Borrador vacío: limpiar
                delete borradores[dniContactoActivo];
                actualizarBorradorEnSidebar(dniContactoActivo, null);
            }
        }

        dniContactoActivo = dniContacto;

        // Al entrar al chat, quitar el indicador de borrador del sidebar
        actualizarBorradorEnSidebar(dniContacto, null);

        // Cerrar el panel de adjuntos si estaba abierto
        cerrarAttachPanel();

        // Actualizar widget de contacto en la columna derecha
        actualizarWidgetContacto(dniContacto);

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

        // Mostrar input y restaurar borrador (si hay uno guardado para este chat)
        const inputWrap = document.getElementById('chatInputWrap');
        if (inputWrap) inputWrap.style.display = '';
        if (input) {
            const borrador = borradores[dniContacto];
            input.innerHTML = borrador !== undefined ? borrador : '';
            // Mover cursor al final
            const sel   = window.getSelection();
            const range = document.createRange();
            range.selectNodeContents(input);
            range.collapse(false);
            sel.removeAllRanges();
            sel.addRange(range);
            // Sincronizar placeholder con la nueva función centralizada
            togglePlaceholder();
        }

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
        if (!contenido || inputEsVacio()) return;

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
        // Limpiar borrador al enviar exitosamente
        delete borradores[dniContactoActivo];
        actualizarBorradorEnSidebar(dniContactoActivo, null);

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

    function cerrarAvatarModal() {
        if (avatarModal) avatarModal.classList.remove('open');
    }

    if (avatarChat && avatarModal) {
        avatarChat.addEventListener('click', function (e) {
            e.stopPropagation();
            avatarModalImg.src = avatarChat.src;
            avatarModal.classList.add('open');
        });
        // Cerrar al hacer click en el overlay (fuera de la imagen)
        avatarModal.addEventListener('click', function (e) {
            if (e.target === avatarModal) cerrarAvatarModal();
        });
        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') cerrarAvatarModal();
        });
    }

    // ── Botón "+" adjuntar publicación ──────────────────
    const attachBtn    = document.getElementById('chatAttachBtn');
    const attachPanel  = document.getElementById('chatAttachPanel');
    const attachClose  = document.getElementById('chatAttachClose');
    const attachBody   = document.getElementById('chatAttachBody');
    const attachLoad   = document.getElementById('chatAttachLoading');

    // Cache de publicaciones para no re-fetchear al abrir el panel varias veces
    // en la misma conversación: { [dniContacto]: { mias, contacto } }
    let cacheAttachPubs = {};

    function abrirAttachPanel() {
        if (!attachPanel || !attachBtn) return;
        attachPanel.hidden = false;
        attachBtn.classList.add('chat-attach-btn--active');
        attachBtn.setAttribute('aria-expanded', 'true');
        cargarAttachPubs();
    }

    function cerrarAttachPanel() {
        if (!attachPanel || !attachBtn) return;
        attachPanel.hidden = true;
        attachBtn.classList.remove('chat-attach-btn--active');
        attachBtn.setAttribute('aria-expanded', 'false');
    }

    function toggleAttachPanel() {
        if (!attachPanel) return;
        if (attachPanel.hidden) abrirAttachPanel();
        else cerrarAttachPanel();
    }

    function cargarAttachPubs() {
        if (!attachBody || !attachLoad) return;

        // Si no hay contacto activo todavía, mostrar solo las mías
        const dni = dniContactoActivo || '';

        // Usar cache si ya tenemos datos para este contacto
        if (cacheAttachPubs[dni]) {
            renderAttachPubs(cacheAttachPubs[dni]);
            return;
        }

        // Mostrar loading
        attachLoad.style.display = 'flex';
        // Limpiar contenido previo salvo el loader
        Array.from(attachBody.children).forEach(function (el) {
            if (el !== attachLoad) el.remove();
        });

        fetch('/Chat/ObtenerPublicacionesChat?dniContacto=' + encodeURIComponent(dni))
            .then(function (r) { return r.json(); })
            .then(function (data) {
                cacheAttachPubs[dni] = data;
                renderAttachPubs(data);
            })
            .catch(function (err) {
                console.error('[attach] Error cargando publicaciones:', err);
                attachLoad.style.display = 'none';
            });
    }

    function buildAttachItem(pub, detailUrl) {
        const btn = document.createElement('button');
        btn.className = 'chat-attach-item';
        btn.type      = 'button';

        const imgSrc = pub.imagen || '/img/book-placeholder.webp';
        btn.innerHTML =
            `<img class="chat-attach-item-img" src="${escapeHtml(imgSrc)}" alt="${escapeHtml(pub.nombre)}" loading="lazy" />`
            + `<div class="chat-attach-item-info">`
            +   `<span class="chat-attach-item-nombre">${escapeHtml(pub.nombre)}</span>`
            +   `<span class="chat-attach-item-precio">$${pub.precio}</span>`
            + `</div>`;

        btn.addEventListener('click', function () {
            insertarLinkPublicacion(pub, detailUrl);
            cerrarAttachPanel();
        });
        return btn;
    }

    function renderAttachPubs(data) {
        if (!attachBody || !attachLoad) return;
        attachLoad.style.display = 'none';

        // Limpiar secciones previas
        Array.from(attachBody.children).forEach(function (el) {
            if (el !== attachLoad) el.remove();
        });

        const mias     = data.mias     || [];
        const contacto = data.contacto || [];
        const hayMias  = mias.length > 0;
        const hayContacto = contacto.length > 0;

        if (!hayMias && !hayContacto) {
            const empty = document.createElement('p');
            empty.className   = 'chat-attach-empty';
            empty.textContent = 'Ninguno de los dos tiene publicaciones activas.';
            attachBody.appendChild(empty);
            return;
        }

        // Sección: mis publicaciones
        const labelMias = document.createElement('p');
        labelMias.className   = 'chat-attach-section-label';
        labelMias.textContent = 'Mis publicaciones';
        attachBody.appendChild(labelMias);

        if (hayMias) {
            mias.forEach(function (pub) {
                const url = '/Book/Detalle/' + pub.id;
                attachBody.appendChild(buildAttachItem(pub, url));
            });
        } else {
            const empty = document.createElement('p');
            empty.className   = 'chat-attach-empty';
            empty.textContent = 'No tenés publicaciones activas.';
            attachBody.appendChild(empty);
        }

        // Sección: publicaciones del contacto (solo si hay contacto activo)
        if (dniContactoActivo) {
            const div = document.createElement('div');
            div.className = 'chat-attach-divider';
            attachBody.appendChild(div);

            const labelContacto = document.createElement('p');
            labelContacto.className   = 'chat-attach-section-label';
            labelContacto.textContent = 'Sus publicaciones';
            attachBody.appendChild(labelContacto);

            if (hayContacto) {
                contacto.forEach(function (pub) {
                    const url = '/Book/Detalle/' + pub.id;
                    attachBody.appendChild(buildAttachItem(pub, url));
                });
            } else {
                const empty = document.createElement('p');
                empty.className   = 'chat-attach-empty';
                empty.textContent = 'No tiene publicaciones activas.';
                attachBody.appendChild(empty);
            }
        }
    }

    // Inserta el nombre del libro como link en el contenteditable
    function insertarLinkPublicacion(pub, url) {
        if (!input) return;

        input.focus();

        // Si el input tiene contenido, agregar espacio antes del link
        const textoActual = input.textContent.trim();

        const link = document.createElement('a');
        link.href             = url;
        link.target           = '_blank';
        link.rel              = 'noopener noreferrer';
        link.className        = 'chat-msg-publi-link';
        link.contentEditable  = 'false';
        link.textContent      = pub.nombre;

        // Mover cursor al final del input antes de insertar
        const sel   = window.getSelection();
        const range = document.createRange();
        range.selectNodeContents(input);
        range.collapse(false);
        sel.removeAllRanges();
        sel.addRange(range);

        // Insertar espacio + link en la posición del cursor
        if (textoActual.length > 0) {
            document.execCommand('insertText', false, ' ');
        }
        range.collapse(false);
        range.insertNode(link);

        // Mover cursor después del link
        range.setStartAfter(link);
        range.setEndAfter(link);
        sel.removeAllRanges();
        sel.addRange(range);

        // Insertar espacio después del link para que el cursor quede editable
        document.execCommand('insertText', false, ' ');

        // Actualizar placeholder
        input.classList.remove('chat-input--empty');
    }

    if (attachBtn)   attachBtn.addEventListener('click', toggleAttachPanel);
    if (attachClose) attachClose.addEventListener('click', cerrarAttachPanel);

    // Cerrar panel al presionar Escape o al hacer click fuera
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape' && attachPanel && !attachPanel.hidden) cerrarAttachPanel();
    });
    document.addEventListener('click', function (e) {
        if (!attachPanel || attachPanel.hidden) return;
        if (!attachPanel.contains(e.target) && e.target !== attachBtn && !attachBtn.contains(e.target)) {
            cerrarAttachPanel();
        }
    });

    // Cerrar panel y limpiar cache al cambiar de conversación
    // (el cierre real está en abrirConversacion directamente)

    // ── Widget del contacto (columna derecha) — carga progresiva ──
    const colVendedor = document.getElementById('chatColVendedor');

    // Cache por DNI: { info: {...}, resenas: {...}, pubs: {...} }
    const cacheWidget = {};

    // ── Helpers de construcción del widget ────────────────

    // Esqueleto completo mientras no hay ningún dato
    function buildWidgetSkeleton() {
        return '<div class="det-vendedor-card">'
            // top
            + '<div class="vsk-top">'
            +   '<div class="vsk-avatar vsk-shimmer"></div>'
            +   '<div style="display:flex;flex-direction:column;align-items:center;gap:6px;width:100%">'
            +     '<div class="vsk-pill vsk-shimmer"></div>'
            +     '<div class="vsk-nombre vsk-shimmer"></div>'
            +     '<div class="vsk-sub vsk-shimmer"></div>'
            +     '<div class="vsk-about vsk-shimmer"></div>'
            +   '</div>'
            + '</div>'
            // stats skeleton
            + '<div class="vsk-stats">'
            +   '<div class="vsk-resena-count vsk-shimmer" style="margin:0 auto"></div>'
            +   '<div class="vsk-barra">'
            +     '<div class="vsk-barra-seg vsk-shimmer"></div>'
            +     '<div class="vsk-barra-seg vsk-shimmer"></div>'
            +     '<div class="vsk-barra-seg vsk-shimmer"></div>'
            +     '<div class="vsk-barra-seg vsk-shimmer"></div>'
            +     '<div class="vsk-barra-seg vsk-shimmer"></div>'
            +   '</div>'
            +   '<div class="vsk-stats-row">'
            +     '<div class="vsk-stat"><div class="vsk-stat-icon vsk-shimmer"></div><div class="vsk-stat-label vsk-stat-label--sm vsk-shimmer"></div></div>'
            +     '<div class="vsk-stat"><div class="vsk-stat-icon vsk-shimmer"></div><div class="vsk-stat-label vsk-stat-label--lg vsk-shimmer"></div></div>'
            +     '<div class="vsk-stat"><div class="vsk-stat-icon vsk-shimmer"></div><div class="vsk-stat-label vsk-stat-label--md vsk-shimmer"></div></div>'
            +   '</div>'
            + '</div>'
            // pubs skeleton
            + '<div class="vsk-pubs">'
            +   '<div class="vsk-pubs-label vsk-shimmer"></div>'
            +   buildPubSkeletonRow() + buildPubSkeletonRow() + buildPubSkeletonRow()
            + '</div>'
            + '</div>';
    }

    function buildPubSkeletonRow() {
        return '<div class="vsk-pub-row">'
            + '<div class="vsk-pub-img vsk-shimmer"></div>'
            + '<div class="vsk-pub-info">'
            +   '<div class="vsk-pub-nombre vsk-shimmer"></div>'
            +   '<div class="vsk-pub-precio vsk-shimmer"></div>'
            + '</div>'
            + '</div>';
    }

    // Construye el bloque "top" con los datos de info
    function buildWidgetTop(info) {
        const avatar  = info.fotoPerfil || DEFAULT_AVATAR;
        const nombre  = escapeHtml(info.nombreComp  || '');
        const anoTxt  = info.anoTexto   || '';
        const espec   = escapeHtml(info.especialidad || '');
        const curso   = escapeHtml(info.curso        || '');
        const about   = escapeHtml(info.aboutMe      || '');

        let subParts = [];
        if (anoTxt)              subParts.push(anoTxt);
        if (espec || curso)      subParts.push([espec, curso].filter(Boolean).join(' '));
        const sub = subParts.join(' · ');

        return '<div class="det-vendedor-top">'
            + `<img src="${escapeHtml(avatar)}" alt="perfil" class="det-vendedor-avatar" id="avatarVendedorChat" style="cursor:pointer" title="Ver foto" />`
            + '<div>'
            +   '<span class="det-vendedor-pill">Contacto</span>'
            +   `<p class="det-vendedor-nombre">${nombre}</p>`
            +   `<p class="det-vendedor-sub">${sub}</p>`
            +   (about ? `<p class="det-vendedor-about">${about}</p>` : '')
            + '</div>'
            + '</div>';
    }

    // Esqueleto de stats (usado mientras las reseñas cargan, pero el top ya está)
    function buildStatsSkeletonInner() {
        return '<div class="vsk-resena-count vsk-shimmer" style="margin:0 auto"></div>'
            + '<div class="vsk-barra">'
            + '<div class="vsk-barra-seg vsk-shimmer"></div>'.repeat(5)
            + '</div>'
            + '<div class="vsk-stats-row">'
            + '<div class="vsk-stat"><div class="vsk-stat-icon vsk-shimmer"></div><div class="vsk-stat-label vsk-stat-label--sm vsk-shimmer"></div></div>'
            + '<div class="vsk-stat"><div class="vsk-stat-icon vsk-shimmer"></div><div class="vsk-stat-label vsk-stat-label--lg vsk-shimmer"></div></div>'
            + '<div class="vsk-stat"><div class="vsk-stat-icon vsk-shimmer"></div><div class="vsk-stat-label vsk-stat-label--md vsk-shimmer"></div></div>'
            + '</div>';
    }

    // Construye el bloque de stats con datos reales
    function buildWidgetStats(info, resenas) {
        const ventasCerradas = info.ventasCerradas || 0;
        let ventasStr;
        if (ventasCerradas >= 10) {
            ventasStr = ((Math.floor(ventasCerradas / 10)) * 10) + '+';
        } else {
            ventasStr = String(ventasCerradas);
        }

        const count   = resenas.resenaCount      || 0;
        const pAten   = resenas.promedioAtencion;
        const pEntr   = resenas.promedioEntrega;

        // Segmento activo (promedio global redondeado)
        let segActivo = 0;
        if (pAten != null && pEntr != null) {
            let g = Math.round((pAten + pEntr) / 2);
            segActivo = Math.max(1, Math.min(5, g));
        }

        function segClass(n) { return segActivo === n ? 'det-rep-seg--activo' : ''; }

        // Clasificar atención
        let atenLabel = '', atenIconMain = '', atenBadge = '';
        if (pAten != null) {
            if (pAten <= 5/3) {
                atenLabel = 'Mala atención';
                atenIconMain = SVG_CHAT;
                atenBadge = SVG_WARN;
            } else if (pAten <= 10/3) {
                atenLabel = 'Atención regular';
                atenIconMain = SVG_CHAT;
                atenBadge = SVG_NEUTRAL;
            } else {
                atenLabel = 'Buena atención';
                atenIconMain = SVG_CHAT;
                atenBadge = SVG_OK;
            }
        }

        // Clasificar entrega
        let entrLabel = '', entrIconMain = '', entrBadge = '';
        if (pEntr != null) {
            if (pEntr <= 5/3) {
                entrLabel = 'No entrega a tiempo';
                entrIconMain = SVG_CLOCK;
                entrBadge = SVG_WARN;
            } else if (pEntr <= 10/3) {
                entrLabel = 'Entrega irregular';
                entrIconMain = SVG_CLOCK;
                entrBadge = SVG_NEUTRAL;
            } else {
                entrLabel = 'Entrega a tiempo';
                entrIconMain = SVG_CLOCK;
                entrBadge = SVG_OK;
            }
        }

        const countLabel = count === 1 ? '1 reseña' : count + ' reseñas';

        let statsRowExtra = '';
        if (count > 0) {
            statsRowExtra =
                '<div class="det-rep-divider"></div>'
                + '<div class="det-rep-stat">'
                +   '<div class="det-rep-stat-icon-wrap">' + atenIconMain + '<span class="det-rep-check">' + atenBadge + '</span></div>'
                +   `<span class="det-rep-stat-desc">${atenLabel}</span>`
                + '</div>'
                + '<div class="det-rep-divider"></div>'
                + '<div class="det-rep-stat">'
                +   '<div class="det-rep-stat-icon-wrap">' + entrIconMain + '<span class="det-rep-check">' + entrBadge + '</span></div>'
                +   `<span class="det-rep-stat-desc">${entrLabel}</span>`
                + '</div>';
        }

        return `<span class="det-rep-resena-count">(${countLabel})</span>`
            + '<div class="det-rep-barra-segmentada">'
            +   `<div class="det-rep-seg det-rep-seg-1 ${segClass(1)}"></div>`
            +   `<div class="det-rep-seg det-rep-seg-2 ${segClass(2)}"></div>`
            +   `<div class="det-rep-seg det-rep-seg-3 ${segClass(3)}"></div>`
            +   `<div class="det-rep-seg det-rep-seg-4 ${segClass(4)}"></div>`
            +   `<div class="det-rep-seg det-rep-seg-5 ${segClass(5)}"></div>`
            + '</div>'
            + '<div class="det-rep-stats-row">'
            +   `<div class="det-rep-stat det-rep-stat--ventas"><span class="det-rep-stat-num">${ventasStr}</span><span class="det-rep-stat-desc">ventas</span></div>`
            +   statsRowExtra
            + '</div>';
    }

    // Esqueleto de publicaciones (usado mientras cargan)
    function buildPubsSkeletonInner() {
        return '<div class="vsk-pubs-label vsk-shimmer" style="width:100px;height:12px;border-radius:6px"></div>'
            + buildPubSkeletonRow() + buildPubSkeletonRow() + buildPubSkeletonRow();
    }

    // Construye el bloque de publicaciones con datos reales
    function buildWidgetPubs(pubsData) {
        const activas = pubsData.activas || 0;
        const lista   = pubsData.publicaciones || [];

        const labelCount = activas > 0
            ? `Publicaciones <span class="det-otras-count">(${activas})</span>`
            : 'Publicaciones';

        let grid = '';
        if (lista.length === 0) {
            grid = '<p class="det-otras-empty">Este usuario no publicó ningún libro todavía.</p>';
        } else {
            lista.forEach(function (p) {
                const img  = escapeHtml(p.imagen || '/img/book-placeholder.webp');
                const nom  = escapeHtml(p.nombre || '');
                const prec = escapeHtml(String(p.precio || ''));
                grid += `<a class="det-otras-thumb" href="/Book/Detalle/${p.id}">`
                    + `<img src="${img}" alt="${nom}" loading="lazy" />`
                    + '<div class="det-otras-thumb-info">'
                    +   `<span class="det-otras-thumb-nombre">${nom}</span>`
                    +   `<span class="det-otras-thumb-precio">$${prec}</span>`
                    + '</div>'
                    + '</a>';
            });
        }

        return `<span class="det-otras-label">${labelCount}</span>`
            + `<div class="det-otras-grid">${grid}</div>`;
    }

    // SVG inline compartidos
    const SVG_CHAT    = "<svg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M8 9h8'/><path d='M8 13h6'/><path d='M18 4a3 3 0 0 1 3 3v8a3 3 0 0 1 -3 3h-5l-5 3v-3h-2a3 3 0 0 1 -3 -3v-8a3 3 0 0 1 3 -3h12z'/></svg>";
    const SVG_CLOCK   = "<svg xmlns='http://www.w3.org/2000/svg' width='26' height='26' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='1.6' stroke-linecap='round' stroke-linejoin='round'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><circle cx='12' cy='12' r='9'/><path d='M12 7v5l2.5 2.5'/></svg>";
    const SVG_OK      = "<svg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='#22c55e' stroke='none'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336zm-1.293 5.953a1 1 0 0 0 -1.32 -.083l-.094 .083l-3.293 3.292l-1.293 -1.292l-.094 -.083a1 1 0 0 0 -1.403 1.403l.083 .094l2 2l.094 .083a1 1 0 0 0 1.226 0l.094 -.083l4 -4l.083 -.094a1 1 0 0 0 -.083 -1.32z'/></svg>";
    const SVG_NEUTRAL = "<svg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='#64748b' stroke='none'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M17 3.34a10 10 0 1 1 -14.995 8.984l-.005 -.324l.005 -.324a10 10 0 0 1 14.995 -8.336z'/><rect x='7' y='10.75' width='10' height='2.5' rx='1.25' fill='white'/></svg>";
    const SVG_WARN    = "<svg xmlns='http://www.w3.org/2000/svg' width='11' height='11' viewBox='0 0 24 24' fill='#f59e0b' stroke='none'><path stroke='none' d='M0 0h24v24H0z' fill='none'/><path d='M12 1.67c.955 0 1.845 .467 2.39 1.247l.105 .16l8.114 13.548a2.928 2.928 0 0 1 -2.307 4.363l-.195 .008h-16.225a2.928 2.928 0 0 1 -2.582 -4.2l.099 -.185l8.11 -13.539a2.928 2.928 0 0 1 2.491 -1.402zm0 10.33a1 1 0 0 0 -1 1v2a1 1 0 0 0 2 0v-2a1 1 0 0 0 -1 -1zm0 -4a1 1 0 0 0 0 2a1 1 0 0 0 0 -2z'/></svg>";

    // ── Carga progresiva del widget ───────────────────────
    function actualizarWidgetContacto(dniContacto) {
        if (!colVendedor) return;

        const cache = cacheWidget[dniContacto];

        // Si tenemos todo en cache, volcar directamente y salir
        if (cache && cache.info && cache.resenas && cache.pubs) {
            renderWidgetCompleto(dniContacto, cache.info, cache.resenas, cache.pubs);
            rewireAvatarModal();
            return;
        }

        // ── PASO 0: skeleton completo ──────────────────────
        colVendedor.innerHTML = buildWidgetSkeleton();

        const enc = encodeURIComponent(dniContacto);

        // ── PASO 1: info básica ────────────────────────────
        fetch('/Chat/ObtenerInfoContacto?dniContacto=' + enc)
            .then(function (r) { return r.json(); })
            .then(function (info) {
                if (!info || dniContacto !== dniContactoActivo) return;
                if (!cacheWidget[dniContacto]) cacheWidget[dniContacto] = {};
                cacheWidget[dniContacto].info = info;

                // Reemplazar sección top con datos reales, mantener stats+pubs skeleton
                const card = colVendedor.querySelector('.det-vendedor-card');
                if (!card) return;
                const vskTop = card.querySelector('.vsk-top');
                if (vskTop) vskTop.outerHTML = buildWidgetTop(info);
            })
            .catch(function (err) { console.error('[widget/info]', err); });

        // ── PASO 2: reseñas ────────────────────────────────
        fetch('/Chat/ObtenerResenasContacto?dniContacto=' + enc)
            .then(function (r) { return r.json(); })
            .then(function (resenas) {
                if (!resenas || dniContacto !== dniContactoActivo) return;
                if (!cacheWidget[dniContacto]) cacheWidget[dniContacto] = {};
                cacheWidget[dniContacto].resenas = resenas;

                const infoActual = cacheWidget[dniContacto].info;
                if (!infoActual) return; // info aún no llegó — se resolverá cuando llegue

                const statsWrap = colVendedor.querySelector('.vsk-stats');
                if (statsWrap) {
                    statsWrap.className = 'det-vendedor-stats-widget';
                    statsWrap.innerHTML = buildWidgetStats(infoActual, resenas);
                }
            })
            .catch(function (err) { console.error('[widget/resenas]', err); });

        // ── PASO 3: publicaciones ──────────────────────────
        fetch('/Chat/ObtenerPublicacionesContacto?dniContacto=' + enc)
            .then(function (r) { return r.json(); })
            .then(function (pubs) {
                if (!pubs || dniContacto !== dniContactoActivo) return;
                if (!cacheWidget[dniContacto]) cacheWidget[dniContacto] = {};
                cacheWidget[dniContacto].pubs = pubs;

                const pubsWrap = colVendedor.querySelector('.vsk-pubs');
                if (pubsWrap) {
                    pubsWrap.className = 'det-otras';
                    pubsWrap.innerHTML = buildWidgetPubs(pubs);
                }
            })
            .catch(function (err) { console.error('[widget/pubs]', err); });

        // Una vez que info llega y el DOM fue actualizado, rewire el avatar modal
        // lo hacemos con un MutationObserver ligero sobre el top del widget
        const obs = new MutationObserver(function () {
            const img = colVendedor.querySelector('#avatarVendedorChat');
            if (img) {
                rewireAvatarModal();
                obs.disconnect();
            }
        });
        obs.observe(colVendedor, { childList: true, subtree: true });
    }

    // Renderiza el widget completo desde cache (sin fetches)
    function renderWidgetCompleto(dniContacto, info, resenas, pubs) {
        colVendedor.innerHTML =
            '<div class="det-vendedor-card">'
            + buildWidgetTop(info)
            + '<div class="det-vendedor-stats-widget">'
            +   buildWidgetStats(info, resenas)
            + '</div>'
            + '<div class="det-otras">'
            +   buildWidgetPubs(pubs)
            + '</div>'
            + '</div>';
    }

    // Reconecta el modal de avatar después de inyectar HTML dinámico
    function rewireAvatarModal() {
        const avatarImg  = document.getElementById('avatarVendedorChat');
        const modalEl    = document.getElementById('chatAvatarModal');
        const modalImgEl = document.getElementById('chatAvatarModalImg');
        if (avatarImg && modalEl && modalImgEl) {
            avatarImg.onclick = function (e) {
                e.stopPropagation();
                modalImgEl.src = avatarImg.src;
                modalEl.classList.add('open');
            };
        }
    }

    // ── Inicialización ────────────────────────────────────
    cargarSidebar();
    prefetchMensajes();

    // Si hay vendedor activo al entrar, disparar la carga progresiva del widget
    if (dniContactoActivo) {
        const body = document.getElementById('chatMessagesBody');
        const loader = document.getElementById('chatMensajesLoader');
        if (body && loader) loader.style.display = 'flex';
        actualizarWidgetContacto(dniContactoActivo);
    }

})();
