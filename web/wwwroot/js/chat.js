// chat.js — lógica del chat
// Las variables de sesión se inyectan desde Chat.cshtml via window.CHAT_CONFIG.

(function () {

    const DNI_USUARIO    = (window.CHAT_CONFIG && window.CHAT_CONFIG.dniUsuario)    || '';
    const DNI_VENDEDOR   = (window.CHAT_CONFIG && window.CHAT_CONFIG.dniVendedor)   || '';
    const TIENE_VENDEDOR = (window.CHAT_CONFIG && window.CHAT_CONFIG.tieneVendedor) || false;
    const WS_URL         = (window.CHAT_CONFIG && window.CHAT_CONFIG.wsUrl)         || 'http://localhost:3000';
    const DEFAULT_AVATAR = '/img/default.webp';

    // ── Badges de mensajes no leídos: { [dniContacto]: número } ─────────────
    const badges = {};

    function getBadgeCount(dni) { return badges[dni] || 0; }

    function incrementarBadge(dni) {
        badges[dni] = (badges[dni] || 0) + 1;
        renderizarBadge(dni);
    }

    function limpiarBadge(dni) {
        if (!badges[dni]) return;
        delete badges[dni];
        renderizarBadge(dni);

        // Si ya no quedan badges en ningún chat, ocultar el puntito del navbar
        if (Object.keys(badges).length === 0) {
            var navBadge = document.getElementById('navChatBadge');
            if (navBadge) navBadge.style.display = 'none';
        }
    }

    function renderizarBadge(dni) {
        const list = document.getElementById('chatConvList');
        if (!list) return;
        const item = list.querySelector(`.chat-conv-item[data-dni="${dni}"]`);
        if (!item) return;

        let badge = item.querySelector('.chat-conv-badge');
        const count = getBadgeCount(dni);

        if (count <= 0) {
            if (badge) badge.remove();
            return;
        }
        if (!badge) {
            badge = document.createElement('span');
            badge.className = 'chat-conv-badge';
            item.appendChild(badge);
        }
        badge.textContent = count > 99 ? '99+' : String(count);
    }

    // ── Conexión WebSocket ───────────────────────────────────────────────────
    let socket = null;

    function conectarSocket() {
        if (!DNI_USUARIO || typeof io === 'undefined') return;

        // Reutilizar el socket creado por el layout global si existe
        socket = window.__booklySocket || io(WS_URL, {
            query: { dni: DNI_USUARIO },
            transports: ['websocket', 'polling'],
            reconnectionAttempts: 10,
            reconnectionDelay: 2000
        });

        socket.on('connect', function () {
            console.log('[ws] conectado como', DNI_USUARIO);
        });

        socket.on('disconnect', function (reason) {
            console.log('[ws] desconectado:', reason);
        });

        // Los mensajes en tiempo real los maneja SignalR (iniciarSignalR).
        // Socket.IO se mantiene solo por compatibilidad con otras partes del sistema.
    }

    let dniContactoActivo = DNI_VENDEDOR || null;

    // Cache de mensajes prefetcheados: { [dniContacto]: Mensaje[] }
    let cacheMensajes = {};

    // Estado de lazy loading por contacto: { [dniContacto]: { cargando: bool, hayMas: bool } }
    let estadoLazyLoad = {};

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
        if (msg.id) div.dataset.msgId = msg.id;
        div.dataset.emisor = msg.idEmisor || '';

        const editadoLabel = msg.editado
            ? '<span class="chat-msg-edited-label">editado</span>'
            : '';

        const chevronBtn = esMio
            ? `<button class="chat-msg-chevron" title="Opciones" aria-label="Opciones del mensaje">
                <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M7 10l5 5 5-5z"/>
                </svg>
               </button>`
            : '';

        div.innerHTML = `<div class="chat-msg-bubble-wrap"><div class="chat-msg-bubble">${procesarContenidoMensaje(msg.contenido)}</div>${chevronBtn}</div>${editadoLabel}`;

        if (esMio) {
            div.querySelector('.chat-msg-chevron').addEventListener('click', function (e) {
                e.stopPropagation();
                abrirCtxMenu(e, div);
            });
        }

        return div;
    }

    // Extrae contenido del input preservando links de publicaciones
    function extraerContenidoConLinks(inputElement) {
        const clone = inputElement.cloneNode(true);
        
        // Reemplazar <br> por saltos de línea
        clone.querySelectorAll('br').forEach(function (br) {
            br.replaceWith('\n');
        });
        
        // Procesar nodos para preservar links
        let resultado = '';
        
        function procesarNodo(nodo) {
            if (nodo.nodeType === Node.TEXT_NODE) {
                resultado += nodo.textContent;
            } else if (nodo.nodeType === Node.ELEMENT_NODE) {
                if (nodo.tagName === 'A' && nodo.classList.contains('chat-msg-publi-link')) {
                    // Preservar link de publicación con formato especial usando ||| como separador
                    resultado += `[PUBLINK|||${nodo.href}|||${nodo.textContent}]`;
                } else {
                    // Procesar hijos de otros elementos
                    nodo.childNodes.forEach(procesarNodo);
                }
            }
        }
        
        clone.childNodes.forEach(procesarNodo);
        return resultado.trim();
    }

    // Procesa contenido de mensaje para renderizar (convierte formato especial a HTML)
    function procesarContenidoMensaje(contenido) {
        // Escapar HTML primero
        let resultado = escapeHtml(contenido);
        
        // Convertir formato especial [PUBLINK|||url|||texto] a links HTML
        resultado = resultado.replace(/\[PUBLINK\|\|\|(.*?)\|\|\|(.*?)\]/g, function (match, url, texto) {
            return `<a href="${escapeHtml(url)}" class="chat-msg-publi-link" target="_blank" rel="noopener noreferrer">${escapeHtml(texto)}</a>`;
        });
        
        return resultado;
    }

    function escapeHtml(str) {
        return str
            .replace(/&/g,  '&amp;')
            .replace(/</g,  '&lt;')
            .replace(/>/g,  '&gt;')
            .replace(/"/g,  '&quot;')
            .replace(/\n/g, '<br>');
    }

    // ── Mover un item del sidebar al top (al recibir mensaje nuevo) ──────────
    function moverChatAlTop(dniContacto) {
        if (!convList) return;
        const item = convList.querySelector(`.chat-conv-item[data-dni="${dniContacto}"]`);
        if (item && item !== convList.firstChild) {
            convList.insertBefore(item, convList.firstChild);
        }
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

                // Cargar badges de no leídos desde BD (persiste entre recargas)
                fetch('/Chat/ObtenerNoLeidos')
                    .then(r => r.json())
                    .then(function (noLeidos) {
                        Object.keys(noLeidos).forEach(function (dni) {
                            if (dni !== dniContactoActivo && noLeidos[dni] > 0) {
                                badges[dni] = noLeidos[dni];
                                renderizarBadge(dni);
                            }
                        });
                    })
                    .catch(function () {});
            })
            .catch(function (err) {
                console.error('[sidebar] Error:', err);
            });
    }

    // ── Prefetch: mensajes de los últimos 10 chats ────────
    // Se dispara al cargar la página (no bloquea la carga).
    // Llena la cache para que al abrir cualquier chat los mensajes aparezcan instantáneamente.
    function prefetchMensajes() {
        fetch('/Chat/PrefetchMensajes')
            .then(r => r.json())
            .then(function (data) {
                cacheMensajes = data || {};

                Object.keys(cacheMensajes).forEach(function (dni) {
                    estadoLazyLoad[dni] = {
                        cargando: false,
                        hayMas: cacheMensajes[dni].length >= 50
                    };
                });

                if (dniContactoActivo && cacheMensajes[dniContactoActivo] !== undefined) {
                    renderizarMensajes(dniContactoActivo, cacheMensajes[dniContactoActivo]);
                }
            })
            .catch(function (err) {
                console.error('[prefetch] Error:', err);
            });
    }

    // ── Renderizar mensajes en el body ────────────────────
    function renderizarMensajes(dniContacto, mensajes, anteponer = false) {
        // Solo aplicar si el contacto sigue siendo el activo
        if (dniContacto !== dniContactoActivo) return;

        const body       = document.getElementById('chatMessagesBody');
        const emptyState = document.getElementById('chatEmptyState');
        const loader     = document.getElementById('chatMensajesLoader');
        if (!body) return;

        // Verificar si hay un fetch en curso ANTES de ocultar el loader
        const estabaConLoader = loader && loader.style.display === 'flex';

        // Ocultar loader
        if (loader) loader.style.display = 'none';

        if (!anteponer) {
            // Carga inicial: limpiar todo
            Array.from(body.querySelectorAll('.chat-msg')).forEach(el => el.remove());
        }

        if (!mensajes || mensajes.length === 0) {
            // Solo mostrar el empty state si este render viene del fetch definitivo
            // (no del prefetch que llega mientras el loader sigue activo)
            if (!anteponer && emptyState && !estabaConLoader) emptyState.style.display = '';
            return;
        }

        if (emptyState) emptyState.style.display = 'none';
        const frag = document.createDocumentFragment();
        mensajes.forEach(function (msg) { frag.appendChild(buildMensajeEl(msg)); });
        
        if (anteponer) {
            // Lazy loading: insertar al principio
            const scrollAltura = body.scrollHeight;
            body.insertBefore(frag, body.firstChild);
            // Mantener la posición de scroll relativa
            body.scrollTop = body.scrollHeight - scrollAltura;
        } else {
            // Carga inicial: agregar al final y scroll al bottom
            body.appendChild(frag);
            body.scrollTop = body.scrollHeight;
        }
    }

    // ── Cargar mensajes más antiguos (lazy loading) ───────
    function cargarMensajesAntiguos(dniContacto) {
        const estado = estadoLazyLoad[dniContacto];
        if (!estado || estado.cargando || !estado.hayMas) return;

        const mensajesActuales = cacheMensajes[dniContacto];
        if (!mensajesActuales || mensajesActuales.length === 0) return;

        // Obtener fecha del mensaje más antiguo
        const mensajeMasAntiguo = mensajesActuales[0];
        const antes = mensajeMasAntiguo.fechaEnvio;

        estado.cargando = true;

        // Mostrar indicador de carga temporal (este sí se puede eliminar)
        const body = document.getElementById('chatMessagesBody');
        const tempLoader = document.createElement('div');
        tempLoader.className = 'chat-load-more-spinner';
        tempLoader.id = 'chatTempLoader';
        tempLoader.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="chat-spinner-icon"><path d="M12 3a9 9 0 1 0 9 9"/></svg><span>Cargando mensajes anteriores...</span>';
        body.insertBefore(tempLoader, body.firstChild);

        fetch('/Chat/ObtenerMensajes?dniContacto=' + encodeURIComponent(dniContacto) + '&antes=' + encodeURIComponent(antes))
            .then(r => r.json())
            .then(function (mensajesNuevos) {
                tempLoader.remove();
                estado.cargando = false;

                if (!mensajesNuevos || mensajesNuevos.length === 0) {
                    estado.hayMas = false;
                    return;
                }

                // Si trajo menos de 50, no hay más
                if (mensajesNuevos.length < 50) {
                    estado.hayMas = false;
                }

                // Agregar al inicio del cache
                cacheMensajes[dniContacto] = mensajesNuevos.concat(cacheMensajes[dniContacto]);

                // Renderizar anteponiendo
                renderizarMensajes(dniContacto, mensajesNuevos, true);
            })
            .catch(function (err) {
                console.error('[lazy-load] Error:', err);
                tempLoader.remove();
                estado.cargando = false;
            });
    }

    // ── Cargar mensajes de una conversación (con cache) ──
    // 1. Si hay cache, renderiza inmediatamente.
    // 2. Siempre hace fetch en background para actualizar con mensajes nuevos.
    // 3. Cancela el fetch anterior si se cambia de chat antes de que termine.
    function cargarMensajes(dniContacto) {
        const body       = document.getElementById('chatMessagesBody');
        const loader     = document.getElementById('chatMensajesLoader');
        const emptyState = document.getElementById('chatEmptyState');
        if (!body) return;

        // Cancelar fetch anterior
        if (abortControllerMensajes) {
            abortControllerMensajes.abort();
        }
        abortControllerMensajes = new AbortController();
        const signal = abortControllerMensajes.signal;

        // Siempre limpiar el área y mostrar el loader mientras carga.
        // No renderizar desde cache para evitar flickers (ej: label "editado" que aparece con delay).
        Array.from(body.querySelectorAll('.chat-msg')).forEach(el => el.remove());
        if (emptyState) emptyState.style.display = 'none';
        if (loader) loader.style.display = 'flex';

        // Fetch — única fuente de verdad
        fetch('/Chat/ObtenerMensajes?dniContacto=' + encodeURIComponent(dniContacto), { signal })
            .then(r => r.json())
            .then(function (mensajes) {
                cacheMensajes[dniContacto] = mensajes;

                // Inicializar estado de lazy load
                if (!estadoLazyLoad[dniContacto]) {
                    estadoLazyLoad[dniContacto] = {
                        cargando: false,
                        hayMas: mensajes.length >= 50
                    };
                }

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

        // Limpiar badge de mensajes no leídos al abrir esta conversación
        limpiarBadge(dniContacto);

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
        const emptyBtn   = document.getElementById('chatEmptyNuevoBtn');
        
        if (emptyTitle) emptyTitle.textContent = 'Iniciá la conversación';
        if (emptySub)   emptySub.innerHTML = `Todavía no hay mensajes con <strong>${nombreContacto || ''}</strong>.<br/>¡Mandá el primero!`;
        
        // Ocultar botón "Nuevo chat" cuando hay un chat seleccionado
        if (emptyBtn) emptyBtn.style.display = 'none';
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
        
        // Extraer contenido preservando links
        const contenidoHtml = extraerContenidoConLinks(input);
        const contenidoTexto = input.textContent.trim();
        
        if (!contenidoTexto || inputEsVacio()) return;

        const body       = document.getElementById('chatMessagesBody');
        const emptyState = document.getElementById('chatEmptyState');
        const nuevoMsg   = { idEmisor: DNI_USUARIO, idReceptor: dniContactoActivo, contenido: contenidoHtml };
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
            body:    JSON.stringify({ dniReceptor: dniContactoActivo, contenido: contenidoHtml })
        })
        .then(r => {
            if (!r.ok) throw new Error('Error al enviar');
            return r.json();
        })
        .then(function (mensajeGuardado) {
            // Asignar el id real al elemento temporal para que el menú contextual funcione
            if (mensajeGuardado && mensajeGuardado.id) {
                msgTemp.dataset.msgId = mensajeGuardado.id;
                nuevoMsg.id = mensajeGuardado.id;
            }
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

        // Al pegar contenido en el input, limpiar estilos inline de cualquier <a>
        // para que los links copiados de mensajes enviados (color blanco) sean visibles.
        input.addEventListener('paste', function () {
            // Esperar un tick para que el contenido pegado ya esté en el DOM
            setTimeout(function () {
                input.querySelectorAll('a').forEach(function (a) {
                    a.removeAttribute('style');
                });
                togglePlaceholder();
            }, 0);
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
    
    // Botón "Nuevo chat" en el empty state
    const btnEmptyNuevo = document.getElementById('chatEmptyNuevoBtn');
    if (btnEmptyNuevo) btnEmptyNuevo.addEventListener('click', abrirModalNuevo);

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

    // Configurar listeners de cierre del modal UNA VEZ (siempre activos)
    if (avatarModal) {
        // Cerrar al hacer click en el overlay (fuera de la imagen)
        avatarModal.addEventListener('click', function (e) {
            if (e.target === avatarModal) cerrarAvatarModal();
        });
    }

    // Si hay un avatar inicial (vendedor por URL), conectarlo
    if (avatarChat && avatarModal && avatarModalImg) {
        avatarChat.addEventListener('click', function (e) {
            e.stopPropagation();
            avatarModalImg.src = avatarChat.src;
            avatarModal.classList.add('open');
        });
    }

    // ── Listener de scroll para lazy loading ──────────────
    const chatBody = document.getElementById('chatMessagesBody');
    if (chatBody) {
        let scrollTimeout = null;
        chatBody.addEventListener('scroll', function () {
            // Debounce para no ejecutar en cada pixel de scroll
            clearTimeout(scrollTimeout);
            scrollTimeout = setTimeout(function () {
                // Si está cerca del top (menos de 100px), cargar más
                if (chatBody.scrollTop < 100 && dniContactoActivo) {
                    cargarMensajesAntiguos(dniContactoActivo);
                }
            }, 150);
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

        // Limpiar <br> residuales que el browser inserta en contenteditable vacío
        if (input.textContent.trim() === '') {
            input.innerHTML = '';
        }

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
            +   '<div class="vsk-stats-row vsk-stats-row--skeleton">'
            +     '<div class="vsk-stat-icon vsk-stat-icon--large vsk-shimmer"></div>'
            +     '<div class="vsk-stat-icon vsk-stat-icon--large vsk-shimmer"></div>'
            +     '<div class="vsk-stat-icon vsk-stat-icon--large vsk-shimmer"></div>'
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
            /* +   '<span class="det-vendedor-pill">Contacto</span>' */
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
            + '<div class="vsk-stats-row vsk-stats-row--skeleton">'
            + '<div class="vsk-stat-icon vsk-stat-icon--large vsk-shimmer"></div>'
            + '<div class="vsk-stat-icon vsk-stat-icon--large vsk-shimmer"></div>'
            + '<div class="vsk-stat-icon vsk-stat-icon--large vsk-shimmer"></div>'
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
        const countText = count === 0 ? 'No ha recibido reseñas todavía' : `En base a ${countLabel}`;

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

        return `<span class="det-rep-resena-count">${countText}</span>`
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

        // Inicializar cache para este contacto
        if (!cacheWidget[dniContacto]) cacheWidget[dniContacto] = {};

        // ── PASO 1: info básica ────────────────────────────
        fetch('/Chat/ObtenerInfoContacto?dniContacto=' + enc)
            .then(function (r) { return r.json(); })
            .then(function (info) {
                if (!info || dniContacto !== dniContactoActivo) return;
                cacheWidget[dniContacto].info = info;

                // Reemplazar sección top con datos reales, mantener stats+pubs skeleton
                const card = colVendedor.querySelector('.det-vendedor-card');
                if (!card) return;
                const vskTop = card.querySelector('.vsk-top');
                if (vskTop) vskTop.outerHTML = buildWidgetTop(info);

                // Si las reseñas ya llegaron mientras esperábamos info, renderizarlas ahora
                const resenasCache = cacheWidget[dniContacto].resenas;
                if (resenasCache) {
                    const statsWrap = colVendedor.querySelector('.vsk-stats');
                    if (statsWrap) {
                        statsWrap.className = 'det-vendedor-stats-widget';
                        statsWrap.innerHTML = buildWidgetStats(info, resenasCache);
                    }
                }
            })
            .catch(function (err) {
                console.error('[widget/info]', err);
                // Fallback: mostrar algo genérico si falla
                if (dniContacto === dniContactoActivo) {
                    const card = colVendedor.querySelector('.det-vendedor-card');
                    if (card) {
                        const vskTop = card.querySelector('.vsk-top');
                        if (vskTop) {
                            vskTop.outerHTML = '<div class="det-vendedor-top"><p style="color:rgba(255,255,255,0.5);text-align:center;padding:20px">Error al cargar información</p></div>';
                        }
                    }
                }
            });

        // ── PASO 2: reseñas ────────────────────────────────
        fetch('/Chat/ObtenerResenasContacto?dniContacto=' + enc)
            .then(function (r) { return r.json(); })
            .then(function (resenas) {
                if (!resenas || dniContacto !== dniContactoActivo) return;
                cacheWidget[dniContacto].resenas = resenas;

                // Solo renderizar si ya tenemos info
                const infoActual = cacheWidget[dniContacto].info;
                if (infoActual) {
                    const statsWrap = colVendedor.querySelector('.vsk-stats');
                    if (statsWrap) {
                        statsWrap.className = 'det-vendedor-stats-widget';
                        statsWrap.innerHTML = buildWidgetStats(infoActual, resenas);
                    }
                }
                // Si info no llegó aún, se renderizará cuando llegue (ver arriba)
            })
            .catch(function (err) {
                console.error('[widget/resenas]', err);
                // Fallback: mostrar stats vacíos si falla
                if (dniContacto === dniContactoActivo) {
                    const infoActual = cacheWidget[dniContacto].info;
                    if (infoActual) {
                        const statsWrap = colVendedor.querySelector('.vsk-stats');
                        if (statsWrap) {
                            statsWrap.className = 'det-vendedor-stats-widget';
                            statsWrap.innerHTML = buildWidgetStats(infoActual, { resenaCount: 0 });
                        }
                    }
                }
            });

        // ── PASO 3: publicaciones ──────────────────────────
        fetch('/Chat/ObtenerPublicacionesContacto?dniContacto=' + enc)
            .then(function (r) { return r.json(); })
            .then(function (pubs) {
                if (!pubs || dniContacto !== dniContactoActivo) return;
                cacheWidget[dniContacto].pubs = pubs;

                const pubsWrap = colVendedor.querySelector('.vsk-pubs');
                if (pubsWrap) {
                    pubsWrap.className = 'det-otras';
                    pubsWrap.innerHTML = buildWidgetPubs(pubs);
                }
            })
            .catch(function (err) {
                console.error('[widget/pubs]', err);
                // Fallback: mostrar mensaje de error
                if (dniContacto === dniContactoActivo) {
                    const pubsWrap = colVendedor.querySelector('.vsk-pubs');
                    if (pubsWrap) {
                        pubsWrap.className = 'det-otras';
                        pubsWrap.innerHTML = '<p class="det-otras-empty">Error al cargar publicaciones</p>';
                    }
                }
            });

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

    // ── Menú contextual (clic derecho sobre mensaje propio) ─────────────
    let ctxMenu = null;      // referencia al div del menú activo
    let ctxMsgEl = null;     // referencia al .chat-msg sobre el que se abrió

    const SVG_EDIT = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M7 7h-1a2 2 0 0 0 -2 2v9a2 2 0 0 0 2 2h9a2 2 0 0 0 2 -2v-1"/><path d="M20.385 6.585a2.1 2.1 0 0 0 -2.97 -2.97l-8.415 8.385v3h3l8.385 -8.415z"/><path d="M16 5l3 3"/></svg>';
    const SVG_TRASH = '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path stroke="none" d="M0 0h24v24H0z" fill="none"/><path d="M4 7l16 0"/><path d="M10 11l0 6"/><path d="M14 11l0 6"/><path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"/><path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"/></svg>';

    function cerrarCtxMenu() {
        if (ctxMenu) { ctxMenu.remove(); ctxMenu = null; }
        ctxMsgEl = null;
    }

    function abrirCtxMenu(e, msgEl) {
        e.preventDefault();
        cerrarCtxMenu();

        ctxMsgEl = msgEl;

        const menu = document.createElement('div');
        menu.className = 'chat-ctx-menu';
        ctxMenu = menu;
        // Botón Editar (solo si el mensaje no fue editado antes)
        const btnEditar = document.createElement('button');
        btnEditar.className = 'chat-ctx-menu-item';
        btnEditar.innerHTML = SVG_EDIT + '<span>Editar</span>';
        btnEditar.addEventListener('click', function () {
            cerrarCtxMenu();
            iniciarEdicionInline(msgEl);
        });

        const yaEditado = !!msgEl.querySelector('.chat-msg-edited-label');

        // Separador
        const sep = document.createElement('div');
        sep.className = 'chat-ctx-menu-sep';

        // Botón Eliminar
        const btnEliminar = document.createElement('button');
        btnEliminar.className = 'chat-ctx-menu-item chat-ctx-menu-item--danger';
        btnEliminar.innerHTML = SVG_TRASH + '<span>Eliminar</span>';
        btnEliminar.addEventListener('click', function () {
            cerrarCtxMenu();
            confirmarEliminarMensaje(msgEl);
        });

        if (!yaEditado) {
            menu.appendChild(btnEditar);
            menu.appendChild(sep);
        }
        menu.appendChild(btnEliminar);
        document.body.appendChild(menu);

        // Posicionar evitando que se salga de la pantalla
        const vw = window.innerWidth;
        const vh = window.innerHeight;

        // Si el evento vino del botón chevron, anclar bajo el botón; si no, usar posición del cursor
        const chevronBtn = e.target.closest('.chat-msg-chevron');
        let x, y;
        if (chevronBtn) {
            const rect = chevronBtn.getBoundingClientRect();
            x = rect.right;
            y = rect.bottom + 4;
        } else {
            x = e.clientX;
            y = e.clientY;
        }

        // Renderizar temporalmente para medir
        requestAnimationFrame(function () {
            const mr = menu.getBoundingClientRect();
            if (x + mr.width > vw - 8)  x = x - mr.width;
            if (y + mr.height > vh - 8)  y = vh - mr.height - 8;
            if (x < 8) x = 8;
            if (y < 8) y = 8;
            menu.style.left = x + 'px';
            menu.style.top  = y + 'px';
        });

        menu.style.left = x + 'px';
        menu.style.top  = y + 'px';
    }

    // Escuchar contextmenu delegado sobre el área de mensajes
    document.addEventListener('contextmenu', function (e) {
        const msgEl = e.target.closest('.chat-msg--outgoing');
        if (!msgEl) {
            // Si hay menú abierto y se hace clic derecho fuera, cerrarlo
            if (ctxMenu) { cerrarCtxMenu(); }
            return;
        }
        // Solo mensajes que tienen id almacenado
        if (!msgEl.dataset.msgId) return;
        abrirCtxMenu(e, msgEl);
    });

    // Cerrar el menú al hacer clic izquierdo en cualquier lugar
    document.addEventListener('click', function (e) {
        if (ctxMenu && !ctxMenu.contains(e.target)) cerrarCtxMenu();
    });

    // ── Edición inline ───────────────────────────────────
    function iniciarEdicionInline(msgEl) {
        const bubble = msgEl.querySelector('.chat-msg-bubble');
        if (!bubble || msgEl.dataset.editando === 'true') return;

        msgEl.dataset.editando = 'true';
        const contenidoOriginal = bubble.innerHTML;

        // Extraer texto plano para el textarea de edición
        const textoPlano = bubble.textContent;

        bubble.innerHTML = '';

        const textarea = document.createElement('textarea');
        textarea.className = 'chat-msg-edit-input';
        textarea.value = textoPlano;
        textarea.rows = 1;

        // Auto-resize del textarea
        function ajustarAltura() {
            textarea.style.height = 'auto';
            textarea.style.height = textarea.scrollHeight + 'px';
        }
        textarea.addEventListener('input', ajustarAltura);

        const actions = document.createElement('div');
        actions.className = 'chat-msg-edit-actions';

        const btnCancelar = document.createElement('button');
        btnCancelar.className = 'chat-msg-edit-btn chat-msg-edit-btn--cancel';
        btnCancelar.textContent = 'Cancelar';

        const btnGuardar = document.createElement('button');
        btnGuardar.className = 'chat-msg-edit-btn chat-msg-edit-btn--save';
        btnGuardar.textContent = 'Guardar';

        actions.appendChild(btnCancelar);
        actions.appendChild(btnGuardar);
        bubble.appendChild(textarea);
        bubble.appendChild(actions);

        requestAnimationFrame(function () {
            ajustarAltura();
            textarea.focus();
            textarea.setSelectionRange(textarea.value.length, textarea.value.length);
        });

        function cancelar() {
            bubble.innerHTML = contenidoOriginal;
            delete msgEl.dataset.editando;
        }

        function guardar() {
            const nuevoTexto = textarea.value.trim();
            if (!nuevoTexto || nuevoTexto === textoPlano) { cancelar(); return; }

            btnGuardar.disabled  = true;
            btnCancelar.disabled = true;
            btnGuardar.textContent = '...';

            const msgId = parseInt(msgEl.dataset.msgId, 10);

            fetch('/Chat/EditarMensaje', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ id: msgId, nuevoContenido: nuevoTexto })
            })
            .then(function (r) {
                if (!r.ok) throw new Error('Error al editar');
                return r.json();
            })
            .then(function (msgActualizado) {
                // Actualizar burbuja con contenido procesado
                const contenidoProc = procesarContenidoMensaje(msgActualizado.contenido || nuevoTexto);
                bubble.innerHTML = contenidoProc;
                delete msgEl.dataset.editando;

                // Agregar / actualizar label "editado"
                let label = msgEl.querySelector('.chat-msg-edited-label');
                if (!label) {
                    label = document.createElement('span');
                    label.className = 'chat-msg-edited-label';
                    msgEl.appendChild(label);
                }
                label.textContent = 'editado';

                // Invalidar cache del contacto activo: el próximo cargarMensajes
                // traerá datos frescos desde la BD (con editado = true ya persistido).
                delete cacheMensajes[dniContactoActivo];
            })
            .catch(function (err) {
                console.error('[editar]', err);
                cancelar();
            });
        }

        btnCancelar.addEventListener('click', cancelar);
        btnGuardar.addEventListener('click', guardar);

        // Atajos de teclado dentro del textarea
        textarea.addEventListener('keydown', function (e) {
            if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); guardar(); }
            if (e.key === 'Escape') { cancelar(); }
        });
    }

    // ── Modal de confirmación de eliminar mensaje ────────
    (function montarConfirmModal() {
        const overlay = document.createElement('div');
        overlay.id = 'chatConfirmOverlay';
        overlay.className = 'chat-confirm-overlay';
        overlay.innerHTML =
            '<div class="chat-confirm-dialog">'
            + '<div class="chat-confirm-icon">'
            +   '<svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">'
            +     '<path stroke="none" d="M0 0h24v24H0z" fill="none"/>'
            +     '<path d="M4 7l16 0"/><path d="M10 11l0 6"/><path d="M14 11l0 6"/>'
            +     '<path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"/>'
            +     '<path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"/>'
            +   '</svg>'
            + '</div>'
            + '<div>'
            +   '<p class="chat-confirm-titulo">¿Eliminar mensaje?</p>'
            +   '<p class="chat-confirm-subtitulo">Esta acción no se puede deshacer.</p>'
            + '</div>'
            + '<div class="chat-confirm-btns">'
            +   '<button class="chat-confirm-btn-cancelar" id="chatConfirmCancelar">Cancelar</button>'
            +   '<button class="chat-confirm-btn-eliminar" id="chatConfirmAceptar">'
            +     '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">'
            +       '<path stroke="none" d="M0 0h24v24H0z" fill="none"/>'
            +       '<path d="M4 7l16 0"/><path d="M10 11l0 6"/><path d="M14 11l0 6"/>'
            +       '<path d="M5 7l1 12a2 2 0 0 0 2 2h8a2 2 0 0 0 2 -2l1 -12"/>'
            +       '<path d="M9 7v-3a1 1 0 0 1 1 -1h4a1 1 0 0 1 1 1v3"/>'
            +     '</svg>'
            +     'Eliminar'
            +   '</button>'
            + '</div>'
            + '</div>';
        document.body.appendChild(overlay);
    })();

    let _confirmCallback = null;

    function mostrarConfirmEliminar(onAceptar) {
        _confirmCallback = onAceptar;
        const overlay = document.getElementById('chatConfirmOverlay');
        if (overlay) overlay.classList.add('chat-confirm-overlay--visible');
    }

    function cerrarConfirmEliminar() {
        _confirmCallback = null;
        const overlay = document.getElementById('chatConfirmOverlay');
        if (overlay) overlay.classList.remove('chat-confirm-overlay--visible');
    }

    document.addEventListener('click', function (e) {
        if (e.target.closest('#chatConfirmCancelar')) {
            cerrarConfirmEliminar();
        }
        if (e.target.closest('#chatConfirmAceptar')) {
            const cb = _confirmCallback;
            cerrarConfirmEliminar();
            if (cb) cb();
        }
    });

    function confirmarEliminarMensaje(msgEl) {
        const msgId = parseInt(msgEl.dataset.msgId, 10);
        if (!msgId) return;

        // Guardar referencia al padre antes de cualquier operación asíncrona
        const parentBody = msgEl.parentNode;

        mostrarConfirmEliminar(function () {
            // Ocultar optimistamente para respuesta inmediata
            msgEl.style.transition = 'opacity 0.2s, transform 0.2s';
            msgEl.style.opacity    = '0';
            msgEl.style.transform  = 'scale(0.95)';

            fetch('/Chat/EliminarMensaje', {
                method:  'POST',
                headers: { 'Content-Type': 'application/json' },
                body:    JSON.stringify({ id: msgId })
            })
            .then(function (r) {
                if (!r.ok) throw new Error('Error al eliminar');
                return r.json();
            })
            .then(function () {
                setTimeout(function () {
                    if (msgEl.parentNode) msgEl.remove();
                }, 200);
                // Remover solo este mensaje del cache, no toda la conversación
                if (cacheMensajes[dniContactoActivo]) {
                    cacheMensajes[dniContactoActivo] = cacheMensajes[dniContactoActivo].filter(function (m) { return m.id !== msgId; });
                }
            })
            .catch(function (err) {
                console.error('[eliminar]', err);
                // Revertir animación si falla
                msgEl.style.opacity   = '';
                msgEl.style.transform = '';
            });
        });
    }

    // ── SignalR: mensajes en tiempo real ─────────────────
    // Conecta al hub, se une al grupo propio (DNI del usuario logueado)
    // y escucha el evento "NuevoMensaje" para renderizar burbujas sin recargar.
    (function iniciarSignalR() {
        if (!window.signalR || !DNI_USUARIO) return;

        const connection = new signalR.HubConnectionBuilder()
            .withUrl('/chatHub')
            .withAutomaticReconnect()   // reintenta si se cae la conexión
            .build();

        // Al recibir un mensaje nuevo del servidor
        connection.on('NuevoMensaje', function (msg) {
            // Asegurarse de que el mensaje sea para este usuario
            if (msg.idReceptor !== DNI_USUARIO) return;

            const dniEmisor = msg.idEmisor;

            // Agregar al cache (aunque la conversación no esté abierta)
            if (!cacheMensajes[dniEmisor]) cacheMensajes[dniEmisor] = [];
            cacheMensajes[dniEmisor].push(msg);

            // Solo renderizar si esa conversación está activa ahora mismo
            if (dniEmisor === dniContactoActivo) {
                const body       = document.getElementById('chatMessagesBody');
                const emptyState = document.getElementById('chatEmptyState');
                if (!body) return;

                if (emptyState) emptyState.style.display = 'none';
                const el = buildMensajeEl(msg);
                body.appendChild(el);

                // Auto-scroll solo si el usuario ya estaba cerca del fondo
                const umbral = 80; // px
                const cercaFondo = body.scrollHeight - body.scrollTop - body.clientHeight < umbral;
                if (cercaFondo) body.scrollTop = body.scrollHeight;

                // Marcar como leído en background
                fetch('/Chat/ObtenerMensajes?dniContacto=' + encodeURIComponent(dniEmisor), { method: 'GET' })
                    .catch(function () {});
            } else {
                // El chat no está abierto → badge + mover al top del sidebar
                const list = document.getElementById('chatConvList');
                if (list) {
                    const itemExistente = list.querySelector(`.chat-conv-item[data-dni="${dniEmisor}"]`);
                    if (!itemExistente) {
                        // Contacto no está en el sidebar todavía → traer sus datos y agregarlo
                        fetch('/Chat/ObtenerInfoContacto?dniContacto=' + encodeURIComponent(dniEmisor))
                            .then(function (r) { return r.json(); })
                            .then(function (info) {
                                if (!info) return;
                                const nuevoItem = buildConvItem({
                                    idContacto: dniEmisor,
                                    nombreComp: info.nombreComp,
                                    fotoPerfil: info.fotoPerfil
                                }, false);
                                nuevoItem.addEventListener('click', function () {
                                    abrirConversacion(dniEmisor, info.nombreComp, info.fotoPerfil);
                                });
                                list.insertBefore(nuevoItem, list.firstChild);
                                incrementarBadge(dniEmisor);
                            })
                            .catch(function () {});
                    } else {
                        // Ya existe → mover al top y mostrar badge
                        moverChatAlTop(dniEmisor);
                        incrementarBadge(dniEmisor);
                    }
                }
            }
        });

        // Al recibir notificación de mensaje editado por el contacto
        connection.on('MensajeEditado', function (payload) {
            if (payload.idEmisor === DNI_USUARIO) return; // ya lo actualizamos localmente
            const body = document.getElementById('chatMessagesBody');
            if (!body) return;
            const el = body.querySelector(`.chat-msg[data-msg-id="${payload.id}"]`);
            if (el) {
                const bubble = el.querySelector('.chat-msg-bubble');
                if (bubble) bubble.innerHTML = procesarContenidoMensaje(payload.contenido);
                let label = el.querySelector('.chat-msg-edited-label');
                if (!label) {
                    label = document.createElement('span');
                    label.className = 'chat-msg-edited-label';
                    el.appendChild(label);
                }
                label.textContent = 'editado';
            }
            // Actualizar cache
            const dni = payload.idEmisor;
            if (cacheMensajes[dni]) {
                const m = cacheMensajes[dni].find(function (m) { return m.id === payload.id; });
                if (m) { m.contenido = payload.contenido; m.editado = true; }
            }
        });

        // Al recibir notificación de mensaje eliminado por el contacto
        connection.on('MensajeEliminado', function (payload) {
            const body = document.getElementById('chatMessagesBody');
            const el = body ? body.querySelector(`.chat-msg[data-msg-id="${payload.id}"]`) : null;
            if (el) {
                el.style.transition = 'opacity 0.2s, transform 0.2s';
                el.style.opacity    = '0';
                el.style.transform  = 'scale(0.95)';
                setTimeout(function () { el.remove(); }, 200);
            }
            // Actualizar cache — buscar en todos los contactos
            for (var dni in cacheMensajes) {
                var idx = cacheMensajes[dni].findIndex(function (m) { return m.id === payload.id; });
                if (idx !== -1) {
                    cacheMensajes[dni].splice(idx, 1);
                    break;
                }
            }
        });

        // Arrancar la conexión y unirse al grupo propio
        connection.start()
            .then(function () {
                return connection.invoke('UnirseAGrupo', DNI_USUARIO);
            })
            .catch(function (err) {
                console.error('[SignalR] Error al conectar:', err);
            });
    })();

    // ── Inicialización ────────────────────────────────────
    cargarSidebar();
    prefetchMensajes();
    conectarSocket();

    // Si hay vendedor activo al entrar, cargar mensajes y widget
    if (dniContactoActivo) {
        const emptyState = document.getElementById('chatEmptyState');
        if (emptyState) emptyState.style.display = 'none';
        cargarMensajes(dniContactoActivo);
        actualizarWidgetContacto(dniContactoActivo);
    }

    // ── Listener global para Escape (cierra todos los modales/drawers) ───
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            cerrarAvatarModal();
            cerrarModalNuevo();
            cerrarDrawerVendedor();
            cerrarCtxMenu();
            cerrarConfirmEliminar();
        }
    });

    // ── Guard de navegación: aviso si hay mensaje sin enviar ─────────────

    function hayMensajePendiente() {
        return !inputEsVacio();
    }

    // __navGuard es consultado por pageloader.js antes de navegar a un link interno.
    // Devuelve true  → pageloader procede (muestra loader y navega).
    // Devuelve false → pageloader cancela; el usuario queda donde estaba.
    window.__navGuard = function (href) {
        if (!hayMensajePendiente()) return true;

        const confirmar = window.confirm(
            '¿Salir sin enviar el mensaje?\n\nTenés un mensaje en curso que se perderá si salís.'
        );

        return confirmar;
    };

})();
