// ===== AUTH MODALS: login, registro y fallback publicar =====

function abrirRegisterModal(e) {
    if (e) e.preventDefault();
    var modal = document.getElementById('registerModal');
    if (!modal) return;
    modal.classList.add('login-modal-overlay--visible');
    document.body.style.overflow = 'hidden';
    setTimeout(function () {
        var input = document.getElementById('rDNI');
        if (input) input.focus();
    }, 80);
    var wrap = document.getElementById('profileDropdownWrap');
    if (wrap) wrap.classList.remove('dropdown-open');
}

function cerrarRegisterModal(e) {
    if (e && e.target !== document.getElementById('registerModal')) return;
    var modal = document.getElementById('registerModal');
    if (!modal) return;
    modal.classList.remove('login-modal-overlay--visible');
    document.body.style.overflow = '';
    if (window.location.pathname.toLowerCase().includes('/usuarios/register') ||
        window.location.pathname.toLowerCase().includes('/register')) {
        window.location.href = '/';
    }
}

function abrirLoginModal(e, returnView) {
    if (e) e.preventDefault();
    var modal = document.getElementById('loginModal');
    if (!modal) return;
    modal.classList.add('login-modal-overlay--visible');
    document.body.style.overflow = 'hidden';
    var returnInput = document.querySelector('#loginModalForm input[name="returnView"]');
    if (returnInput) returnInput.value = returnView || '';
    setTimeout(function () {
        var input = document.getElementById('modalDNI');
        if (input) input.focus();
    }, 80);
    var wrap = document.getElementById('profileDropdownWrap');
    if (wrap) wrap.classList.remove('dropdown-open');
}

function cerrarLoginModal(e) {
    if (e && e.target !== document.getElementById('loginModal')) return;
    var modal = document.getElementById('loginModal');
    if (!modal) return;
    modal.classList.remove('login-modal-overlay--visible');
    document.body.style.overflow = '';
    var url = new URL(window.location.href);
    if (url.searchParams.has('modal')) {
        url.searchParams.delete('modal');
        url.searchParams.delete('returnView');
        history.replaceState(null, '', url.toString());
    }
}

function abrirPublicarModal() {
    var modal = document.getElementById('publicarModal');
    if (modal) {
        if (typeof window.abrirPublicarModalLoggedIn === 'function') {
            window.abrirPublicarModalLoggedIn();
        }
        return;
    }
    var url = (document.getElementById('appConfig') || document.body).dataset.publicarLoginUrl;
    if (url) window.location.href = url;
}

document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') {
        cerrarLoginModal();
        cerrarRegisterModal();
    }
});

document.addEventListener('DOMContentLoaded', function () {
    var params = new URLSearchParams(window.location.search);
    var which = params.get('modal');
    if (which === 'login') abrirLoginModal(null, params.get('returnView') || '');
    if (which === 'register') abrirRegisterModal();

    var body = document.getElementById('appConfig') || document.body;
    if (body.dataset.modalError) {
        var target = body.dataset.modalErrorTarget || 'login';
        var errId = target === 'register' ? 'registerModalError' : 'loginModalError';
        var errEl = document.getElementById(errId);
        if (errEl) {
            errEl.textContent = body.dataset.modalError;
            errEl.style.display = 'block';
        }
    }

    var rAno = document.getElementById('rAno');
    var rEsp = document.getElementById('rEspecialidad');
    if (rAno && rEsp) {
        function updateEsp() {
            var v = parseInt(rAno.value, 10);
            if (v >= 4) {
                rEsp.disabled = false;
                rEsp.classList.remove('organizacion-disabled');
            } else {
                rEsp.disabled = true;
                rEsp.classList.add('organizacion-disabled');
                rEsp.value = '';
            }
        }
        rAno.addEventListener('change', updateEsp);
        updateEsp();
    }

    var rPwd = document.getElementById('rPassword');
    var rConf = document.getElementById('rConfirmar');
    var rErr = document.getElementById('rPasswordError');
    var rForm = document.getElementById('registerModalForm');
    if (rPwd && rConf && rErr && rForm) {
        function validar() {
            if (rConf.value && rPwd.value !== rConf.value) {
                rErr.style.display = 'block';
                rConf.style.borderColor = 'rgba(215,38,61,0.6)';
            } else {
                rErr.style.display = 'none';
                rConf.style.borderColor = '';
            }
        }
        rPwd.addEventListener('input', validar);
        rConf.addEventListener('input', validar);
        rForm.addEventListener('submit', function (e) {
            if (rPwd.value !== rConf.value) {
                e.preventDefault();
                if (typeof ocultarPageLoader === 'function') ocultarPageLoader();
                rErr.style.display = 'block';
                rConf.focus();
                return;
            }
            var btn = rForm.querySelector('button[type="submit"]');
            if (typeof setButtonLoading === 'function') setButtonLoading(btn, true);
        });
    }

    var loginForm = document.getElementById('loginModalForm');
    if (loginForm) {
        loginForm.addEventListener('submit', function () {
            var btn = loginForm.querySelector('button[type="submit"]');
            if (typeof setButtonLoading === 'function') setButtonLoading(btn, true);
        });
    }
});
