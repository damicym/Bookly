// ===== MODALES PUBLICAR / EDITAR (layout) =====

var editarModalOriginalData = null;
var editarModalNewFileSelected = false;
var editarModalImageRemoved = false;

function abrirPublicarModalLoggedIn() {
    var modal = document.getElementById('publicarModal');
    if (!modal) {
        var loginUrl = (document.getElementById('appConfig') || document.body).dataset.loginUrl;
        if (loginUrl) window.location.href = loginUrl;
        return;
    }
    document.getElementById('publicarModalForm').reset();
    document.getElementById('pubModalImgPreview').src = '/img/book-placeholder.webp';
    document.getElementById('pubModalFileName').textContent = 'Sin imagen';
    modal.classList.add('login-modal-overlay--visible');
    document.body.style.overflow = 'hidden';
    setTimeout(function () {
        var input = document.getElementById('pubModalNombre');
        if (input) input.focus();
    }, 80);
}

window.abrirPublicarModalLoggedIn = abrirPublicarModalLoggedIn;

function cerrarPublicarModal(e) {
    if (e && e.target !== document.getElementById('publicarModal')) return;
    var modal = document.getElementById('publicarModal');
    if (!modal) return;
    modal.classList.remove('login-modal-overlay--visible');
    document.body.style.overflow = '';
}

async function abrirEditarModal(id) {
    var modal = document.getElementById('editarModal');
    if (!modal) return;
    var allEditBtns = document.querySelectorAll('.desearBtnForm.editar');
    var foundBtn = null;
    allEditBtns.forEach(function (form) {
        if (form.getAttribute('onclick') && form.getAttribute('onclick').includes('abrirEditarModal(' + id + ')')) {
            foundBtn = form;
        }
    });
    if (foundBtn) foundBtn.style.opacity = '0.5';
    try {
        var res = await fetch('/Book/ObtenerPublicacion?id=' + id);
        var data = await res.json();
        if (!data.found) { if (foundBtn) foundBtn.style.opacity = ''; return; }
        document.getElementById('editarModalId').value = data.id;
        document.getElementById('editModalNombre').value = data.nombre || '';
        document.getElementById('editModalMateria').value = data.materia || '';
        document.getElementById('editModalAno').value = data.ano || 1;
        document.getElementById('editModalEditorial').value = data.editorial || '';
        document.getElementById('editModalEstado').value = data.estadoLibro || 'Como nuevo';
        document.getElementById('editModalPrecio').value = data.precio != null ? data.precio : '';
        document.getElementById('editModalDesc').value = data.descripcion || '';
        editarModalOriginalData = {
            estadoLibro: document.getElementById('editModalEstado').value,
            precio: document.getElementById('editModalPrecio').value,
            descripcion: document.getElementById('editModalDesc').value.trim(),
            tieneImagen: !!data.tieneImagen
        };
        editarModalNewFileSelected = false;
        editarModalImageRemoved = false;
        document.getElementById('editModalImgPreview').src = data.imagenSrc;
        document.getElementById('editarModalImgEliminada').value = 'false';
        document.getElementById('editModalEliminarImgBtn').style.display = data.tieneImagen ? 'flex' : 'none';
        document.getElementById('editModalFileName').textContent = data.tieneImagen ? 'Imagen actual del libro' : 'Sin imagen';
        var overlaySpan = document.querySelector('#editarModal .edit-img-overlay span');
        if (overlaySpan) overlaySpan.textContent = data.tieneImagen ? 'Cambiar imagen' : 'Subir imagen';
        document.getElementById('editModalFileInput').value = '';
    } catch (e) {
        console.error(e);
        if (foundBtn) foundBtn.style.opacity = '';
        return;
    }
    if (foundBtn) foundBtn.style.opacity = '';
    modal.classList.add('login-modal-overlay--visible');
    document.body.style.overflow = 'hidden';
}

function cerrarEditarModal(e) {
    if (e && e.target !== document.getElementById('editarModal')) return;
    var modal = document.getElementById('editarModal');
    if (!modal) return;
    modal.classList.remove('login-modal-overlay--visible');
    document.body.style.overflow = '';
    var btn = document.getElementById('editarModalSubmitBtn');
    if (typeof setButtonLoading === 'function') setButtonLoading(btn, false);
    editarModalOriginalData = null;
    editarModalNewFileSelected = false;
    editarModalImageRemoved = false;
}

function editarModalEliminarImagen() {
    document.getElementById('editarModalImgEliminada').value = 'true';
    document.getElementById('editModalImgPreview').src = '/img/book-placeholder.webp';
    document.getElementById('editModalEliminarImgBtn').style.display = 'none';
    document.getElementById('editModalFileName').textContent = 'Sin imagen';
    var overlaySpan = document.querySelector('#editarModal .edit-img-overlay span');
    if (overlaySpan) overlaySpan.textContent = 'Subir imagen';
    document.getElementById('editModalFileInput').value = '';
    editarModalImageRemoved = true;
    editarModalNewFileSelected = false;
}

function editarModalPrecioIgual(a, b) {
    if (a === b) return true;
    var na = parseFloat(a), nb = parseFloat(b);
    if (!isNaN(na) && !isNaN(nb)) return na === nb;
    return String(a).trim() === String(b).trim();
}

function editarModalHasChanges() {
    if (!editarModalOriginalData) return true;
    var estado = document.getElementById('editModalEstado').value;
    var precio = document.getElementById('editModalPrecio').value;
    var descripcion = document.getElementById('editModalDesc').value.trim();
    if (estado !== editarModalOriginalData.estadoLibro) return true;
    if (!editarModalPrecioIgual(precio, editarModalOriginalData.precio)) return true;
    if (descripcion !== editarModalOriginalData.descripcion) return true;
    if (editarModalNewFileSelected) return true;
    if (editarModalImageRemoved) return true;
    return false;
}

function initAutocompleteModal(inputId, materiaId, anoId, editorialId, libroIdId, indicatorId) {
    var input = document.getElementById(inputId);
    if (!input) return;
    var container = document.createElement('div');
    container.className = 'autocomplete-dropdown';
    container.style.display = 'none';
    input.parentNode.style.position = 'relative';
    input.parentNode.appendChild(container);

    function getSubmitBtn() {
        var form = input.closest('form');
        return form ? form.querySelector('button[type="submit"]') : null;
    }

    async function fetchSuggestions(text) {
        if (!text || text.length < 1) { container.style.display = 'none'; return; }
        var btn = getSubmitBtn();
        if (typeof setButtonLoading === 'function') setButtonLoading(btn, true);
        try {
            var resp = await fetch('/Book/AutocompleteNombres?q=' + encodeURIComponent(text));
            var data = await resp.json();
            renderSuggestions(data || []);
        } catch (e) {
            container.style.display = 'none';
        } finally {
            if (typeof setButtonLoading === 'function') setButtonLoading(btn, false);
        }
    }

    function renderSuggestions(list) {
        container.innerHTML = '';
        if (!list.length) { container.style.display = 'none'; return; }
        list.forEach(function (item) {
            var div = document.createElement('div');
            div.className = 'autocomplete-item';
            div.textContent = item;
            div.addEventListener('click', async function () {
                input.value = item;
                container.style.display = 'none';
                var btn = getSubmitBtn();
                if (typeof setButtonLoading === 'function') setButtonLoading(btn, true);
                try {
                    var r = await fetch('/Book/ObtenerLibroPorNombre?nombre=' + encodeURIComponent(item));
                    var d = await r.json();
                    if (d && d.found) {
                        var el = document.getElementById(editorialId);
                        var ma = document.getElementById(materiaId);
                        var an = document.getElementById(anoId);
                        var li = document.getElementById(libroIdId);
                        var ind = document.getElementById(indicatorId);
                        if (el) el.value = d.editorial || '';
                        if (ma) ma.value = d.materia || '';
                        if (an) an.value = d.ano || '';
                        if (li) li.value = d.id || '';
                        if (ind) { ind.style.display = 'block'; ind.innerHTML = '✓ Libro existente'; }
                    }
                } catch (e) {
                } finally {
                    if (typeof setButtonLoading === 'function') setButtonLoading(btn, false);
                }
            });
            container.appendChild(div);
        });
        container.style.display = 'block';
    }

    input.addEventListener('input', function () {
        var li = document.getElementById(libroIdId);
        if (li) li.value = '';
        fetchSuggestions(input.value.trim());
    });
    document.addEventListener('click', function (e) {
        if (!input.contains(e.target) && !container.contains(e.target)) container.style.display = 'none';
    });
}

document.addEventListener('DOMContentLoaded', function () {
    if (document.getElementById('publicarModal')) {
        window.abrirPublicarModal = abrirPublicarModalLoggedIn;
    }

    if (!document.getElementById('publicarModal') && !document.getElementById('editarModal')) return;

    var fi = document.getElementById('pubModalFileInput');
    if (fi) {
        fi.addEventListener('change', function () {
            var file = this.files[0];
            if (!file) return;
            document.getElementById('pubModalFileName').textContent = file.name;
            var reader = new FileReader();
            reader.onload = function (e) { document.getElementById('pubModalImgPreview').src = e.target.result; };
            reader.readAsDataURL(file);
        });
    }

    initAutocompleteModal(
        'pubModalNombre', 'pubModalMateria', 'pubModalAno',
        'pubModalEditorial', 'pubModalLibroId', 'pubModalLibroIndicator'
    );

    var pubForm = document.getElementById('publicarModalForm');
    if (pubForm) {
        pubForm.addEventListener('submit', function () {
            var btn = pubForm.querySelector('button[type="submit"]');
            if (typeof setButtonLoading === 'function') setButtonLoading(btn, true);
        });
    }

    var editForm = document.getElementById('editarModalForm');
    if (editForm) {
        editForm.addEventListener('submit', function (event) {
            var btn = document.getElementById('editarModalSubmitBtn');
            if (!editarModalHasChanges()) {
                event.preventDefault();
                if (typeof setButtonLoading === 'function') setButtonLoading(btn, false);
                if (typeof ocultarPageLoader === 'function') ocultarPageLoader();
                cerrarEditarModal();
                return;
            }
            if (typeof mostrarPageLoader === 'function') mostrarPageLoader();
            if (typeof setButtonLoading === 'function') setButtonLoading(btn, true);
        });
    }

    var efi = document.getElementById('editModalFileInput');
    if (efi) {
        efi.addEventListener('change', function () {
            var file = this.files[0];
            if (!file) return;
            document.getElementById('editModalFileName').textContent = file.name;
            document.getElementById('editarModalImgEliminada').value = 'false';
            editarModalNewFileSelected = true;
            editarModalImageRemoved = false;
            var reader = new FileReader();
            reader.onload = function (e) { document.getElementById('editModalImgPreview').src = e.target.result; };
            reader.readAsDataURL(file);
        });
    }

    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            cerrarPublicarModal();
            cerrarEditarModal();
        }
    });
});
