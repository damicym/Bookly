// ===== WELCOME TOAST =====

(function () {
    var toast = document.getElementById('welcomeToast');
    if (!toast) return;
    requestAnimationFrame(function () {
        requestAnimationFrame(function () {
            toast.classList.add('welcome-toast--visible');
        });
    });
    setTimeout(function () {
        toast.classList.remove('welcome-toast--visible');
        toast.addEventListener('transitionend', function () {
            toast.remove();
        }, { once: true });
    }, 3500);
})();
