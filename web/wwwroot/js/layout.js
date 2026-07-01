// ===== LAYOUT: header, nav, dropdown, búsqueda mobile =====

(function () {
    var btn = document.getElementById('favBtnHeader');
    if (btn) {
        var isProfile = document.querySelector('.profile-tabs') !== null;
        if (isProfile && window.location.hash === '#favoritos') {
            btn.classList.add('activeNavBtn');
        }
        if (isProfile) {
            btn.addEventListener('click', function (e) {
                e.preventDefault();
                if (typeof activarTab === 'function') activarTab('favoritos');
                history.replaceState(null, '', window.location.pathname);
                btn.classList.add('activeNavBtn');
            });
        }
        document.querySelectorAll('.profile-tab').forEach(function (tab) {
            tab.addEventListener('click', function () {
                if (tab.dataset.tab === 'favoritos') {
                    btn.classList.add('activeNavBtn');
                } else {
                    btn.classList.remove('activeNavBtn');
                }
            });
        });
    }

    var wrap = document.getElementById('profileDropdownWrap');
    if (wrap) {
        var closeTimer;
        wrap.addEventListener('mouseenter', function () {
            clearTimeout(closeTimer);
            wrap.classList.add('dropdown-open');
        });
        wrap.addEventListener('mouseleave', function () {
            closeTimer = setTimeout(function () {
                wrap.classList.remove('dropdown-open');
            }, 400);
        });
    }

    var hamburgerBtn = document.getElementById('headerHamburger');
    var menu = document.getElementById('headerHamburgerMenu');
    var profileWrap = document.getElementById('profileDropdownWrap');
    if (hamburgerBtn && menu) {
        var hamburgerCloseTimer;

        function openHamburger() {
            clearTimeout(hamburgerCloseTimer);
            menu.classList.add('is-open');
            hamburgerBtn.classList.add('is-open');
            if (profileWrap) profileWrap.classList.remove('dropdown-open');
        }

        function closeHamburger() {
            menu.classList.remove('is-open');
            hamburgerBtn.classList.remove('is-open');
        }

        function scheduleHamburgerClose() {
            hamburgerCloseTimer = setTimeout(closeHamburger, 300);
        }

        hamburgerBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            menu.classList.contains('is-open') ? closeHamburger() : openHamburger();
        });

        hamburgerBtn.addEventListener('mouseenter', openHamburger);
        hamburgerBtn.addEventListener('mouseleave', scheduleHamburgerClose);
        menu.addEventListener('mouseenter', function () { clearTimeout(hamburgerCloseTimer); });
        menu.addEventListener('mouseleave', scheduleHamburgerClose);

        document.addEventListener('click', function (e) {
            if (!menu.contains(e.target) && e.target !== hamburgerBtn) closeHamburger();
        });

        if (profileWrap) {
            profileWrap.addEventListener('mouseenter', function () {
                clearTimeout(hamburgerCloseTimer);
                closeHamburger();
            });
        }

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeHamburger();
        });
    }

    var searchBtn = document.getElementById('headerSearchBtn');
    var panel = document.querySelector('header .searchNFilter');
    var input = document.getElementById('searchInput');
    var header = document.querySelector('header');
    if (searchBtn && panel && header) {
        function openSearch() {
            header.classList.add('search-open');
            searchBtn.setAttribute('aria-expanded', 'true');
            if (input) setTimeout(function () { input.focus(); }, 60);
        }

        function closeSearch() {
            header.classList.remove('search-open');
            searchBtn.setAttribute('aria-expanded', 'false');
        }

        searchBtn.addEventListener('click', function (e) {
            e.stopPropagation();
            header.classList.contains('search-open') ? closeSearch() : openSearch();
        });

        document.addEventListener('click', function (e) {
            if (!header.classList.contains('search-open')) return;
            if (panel.contains(e.target) || e.target === searchBtn) return;
            closeSearch();
        });

        document.addEventListener('keydown', function (e) {
            if (e.key === 'Escape') closeSearch();
        });
    }
})();
