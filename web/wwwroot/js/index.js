// ===== HOME INDEX: carrusel de publicaciones =====

(function () {
    function initCarrusel() {
        var track = document.getElementById('carruselTrack');
        var outer = track ? track.parentElement : null;
        var wrapper = outer ? outer.parentElement : null;
        var btnPrev = document.getElementById('carruselPrev');
        var btnNext = document.getElementById('carruselNext');
        if (!track || !btnPrev || !btnNext || !outer) return;

        var CARD_W = 230 + 32;
        var PAD_LEFT = 60;

        function updateMask() {
            var atEnd = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
            var atStart = track.scrollLeft <= 4;
            var pastFirstCard = track.scrollLeft > 262;
            track.style.maskImage = '';
            track.style.webkitMaskImage = '';
            outer.style.maskImage = '';
            outer.style.webkitMaskImage = '';
            if (atEnd) { outer.classList.remove('has-more'); if (wrapper) wrapper.classList.remove('has-more'); }
            else { outer.classList.add('has-more'); if (wrapper) wrapper.classList.add('has-more'); }
            if (atStart || !pastFirstCard) { outer.classList.remove('scrolled'); if (wrapper) wrapper.classList.remove('scrolled'); }
            else { outer.classList.add('scrolled'); if (wrapper) wrapper.classList.add('scrolled'); }
        }

        function updateBtns() {
            var scrolled = track.scrollLeft - PAD_LEFT;
            btnPrev.disabled = scrolled <= 4;
            btnNext.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 4;
        }

        btnPrev.addEventListener('click', function () { track.scrollBy({ left: -CARD_W * 3, behavior: 'smooth' }); });
        btnNext.addEventListener('click', function () { track.scrollBy({ left: CARD_W * 3, behavior: 'smooth' }); });
        track.addEventListener('scroll', function () { updateBtns(); updateMask(); }, { passive: true });
        requestAnimationFrame(function () {
            requestAnimationFrame(function () {
                track.scrollLeft = 0;
                updateBtns();
                updateMask();
            });
        });
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initCarrusel);
    } else {
        initCarrusel();
    }
})();
