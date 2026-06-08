// ===== PAGE LOADER — libro abierto estilo logo Bookly =====
(function () {

    /*
      SVG: libro abierto visto desde arriba, como el logo.
      viewBox 0 0 120 80
      Lomo vertical en x=60.
      Tapa izq: polígono de x=60 al borde izq con perspectiva.
      Tapa der: simétrica.
      Páginas en abanico a la derecha se animan.
    */
    var LOADER_HTML = `
        <svg class="loader-book-svg" viewBox="0 0 120 82" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">

            <!-- Tapa izquierda — forma de perspectiva como el logo -->
            <path class="lb-left-cover"
                d="M60,8 C40,12 18,22 8,40 C18,58 40,68 60,72"/>

            <!-- Lomo -->
            <line class="lb-spine" x1="60" y1="6" x2="60" y2="74"/>

            <!-- Páginas izquierda estáticas (líneas en abanico) -->
            <g class="lb-lines-left">
                <path d="M60,40 C48,36 30,34 14,36"/>
                <path d="M60,40 C50,30 36,24 20,22"/>
                <path d="M60,40 C50,50 36,56 20,58"/>
            </g>

            <!-- Páginas derecha que se pasan (las 3 capas animadas) -->
            <!-- Capa c: la más al fondo, más tenue -->
            <path class="lb-page-c"
                d="M60,8 C80,12 102,22 112,40 C102,58 80,68 60,72"/>

            <!-- Capa b: intermedia -->
            <path class="lb-page-b"
                d="M60,8 C80,12 102,22 112,40 C102,58 80,68 60,72"/>

            <!-- Capa a: la más de arriba, más visible -->
            <path class="lb-page-a"
                d="M60,8 C80,12 102,22 112,40 C102,58 80,68 60,72"/>

            <!-- Tapa derecha (por encima, contorno exterior) -->
            <path class="lb-right-cover"
                d="M60,6 C82,10 106,20 116,40 C106,60 82,70 60,74"/>

            <!-- Líneas de texto lado derecho (estáticas, muy tenues) -->
            <g stroke-opacity="0.18" stroke-width="1">
                <line x1="70" y1="32" x2="100" y2="29"/>
                <line x1="70" y1="40" x2="103" y2="40"/>
                <line x1="70" y1="48" x2="100" y2="51"/>
            </g>

            <!-- Líneas de texto lado izquierdo (estáticas, muy tenues) -->
            <g stroke-opacity="0.18" stroke-width="1">
                <line x1="50" y1="32" x2="22" y2="29"/>
                <line x1="50" y1="40" x2="19" y2="40"/>
                <line x1="50" y1="48" x2="22" y2="51"/>
            </g>
        </svg>
        <div class="loader-dots" aria-hidden="true">
            <span></span><span></span><span></span>
        </div>
    `;

    function crearLoader() {
        // El loader ya existe en el HTML estático al inicio del body
        // Esta función se mantiene como no-op por compatibilidad
    }

    function mostrarLoader() {
        var el = document.getElementById('pageLoader');
        if (!el) { crearLoader(); el = document.getElementById('pageLoader'); }
        el.classList.remove('loader-hiding');
        el.style.display = 'flex';
    }

    function ocultarLoader() {
        var el = document.getElementById('pageLoader');
        if (!el) return;
        el.classList.add('loader-hiding');
        setTimeout(function () {
            el.style.display = 'none';
            el.classList.remove('loader-hiding');
        }, 150);
    }

    // Crear al cargar
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', crearLoader);
    } else {
        crearLoader();
    }

    // ── Interceptar clicks en links internos ──
    document.addEventListener('click', function (e) {
        // Caso 1: <a href>
        var link = e.target.closest('a[href]');
        if (link) {
            var href = link.getAttribute('href');
            if (!href) return;
            if (
                href.startsWith('#') ||
                href.startsWith('javascript:') ||
                href.startsWith('mailto:') ||
                link.target === '_blank' ||
                link.hasAttribute('download')
            ) return;
            try {
                var url = new URL(href, window.location.origin);
                if (url.origin !== window.location.origin) return;
                if (url.pathname === window.location.pathname && url.hash) return;
            } catch (err) { return; }
            e.preventDefault();
            mostrarLoader();
            setTimeout(function () { window.location.href = href; }, 60);
            return;
        }

        // Caso 2: elemento con onclick que navega (ej: divs de publicaciones)
        var el = e.target.closest('[onclick]');
        if (!el) return;
        var onclickVal = el.getAttribute('onclick') || '';
        var match = onclickVal.match(/window\.location\.href\s*=\s*['"]([^'"]+)['"]/);
        if (!match) return;
        var dest = match[1];
        try {
            var destUrl = new URL(dest, window.location.origin);
            if (destUrl.origin !== window.location.origin) return;
            if (destUrl.pathname === window.location.pathname) return;
        } catch (err) { return; }
        mostrarLoader();
    }, true);

    // ── Interceptar submit de forms que redirigen ──
    document.addEventListener('submit', function (e) {
        var form = e.target;
        if (!form) return;
        if (form.dataset.noLoader) return;
        if (form.classList.contains('desearBtnForm')) return;
        var onsubmit = form.getAttribute('onsubmit') || '';
        if (onsubmit.includes('desearLibro') || onsubmit.includes('quitarFavorito')) return;
        if (onsubmit.includes('confirm(')) return;
        var action = form.getAttribute('action') || '';
        if (!action || action === '#') return;
        mostrarLoader();
    }, true);

    // ── Ocultar al cargar la página ──
    // En el catálogo, el loader se oculta manualmente desde buscar.js
    // para esperar a que las publicaciones terminen de cargar
    var esCatalogo = window.location.pathname.toLowerCase().includes('/home/buscar') ||
                     window.location.pathname.toLowerCase().includes('/home/catalogo') ||
                     document.getElementById('resultados') !== null;

    function ocultarLoaderAlCargar() {
        if (!esCatalogo) ocultarLoader();
    }

    // DOMContentLoaded: el HTML está listo, no esperamos imágenes ni recursos externos
    document.addEventListener('DOMContentLoaded', function() {
        esCatalogo = document.getElementById('resultados') !== null;
        ocultarLoaderAlCargar();
    });

    // pageshow cubre navegación con bfcache (botón atrás/adelante del browser)
    window.addEventListener('pageshow', ocultarLoaderAlCargar);

    window.mostrarPageLoader = mostrarLoader;
    window.ocultarPageLoader = ocultarLoader;

    // ── Interceptar fetch global ──
    var _fetchOriginal = window.fetch;
    var _fetchActivo = 0;
    window.fetch = function(url) {
        // No mostrar loader para búsquedas en tiempo real (se disparan con cada tecla)
        var urlStr = (url || '').toString();
        var esBusqueda = urlStr.includes('/Home/Buscar') || urlStr.includes('/Home/Catalogo') || urlStr.includes('/Book/AutocompleteNombres');
        if (esBusqueda) return _fetchOriginal.apply(this, arguments);

        _fetchActivo++;
        mostrarLoader();
        return _fetchOriginal.apply(this, arguments).finally(function() {
            _fetchActivo--;
            if (_fetchActivo <= 0) {
                _fetchActivo = 0;
                ocultarLoader();
            }
        });
    };

})();
