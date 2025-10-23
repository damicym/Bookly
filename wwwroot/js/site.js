// Especialidad deshabilitado
const anoSelect = document.getElementById('ano');
const especialidadSelect = document.getElementById('especialidad');

anoSelect.addEventListener('change', () => {
  const valor = parseInt(anoSelect.value);

  // Deshabilita si el año es menor a 3 o no es un número
  const deshabilitado = isNaN(valor) || valor < 3;
  especialidadSelect.disabled = deshabilitado;

  // Si está habilitado, que sea requerido; si no, quita el atributo
  if (deshabilitado) {
    especialidadSelect.removeAttribute('required');
  } else {
    especialidadSelect.setAttribute('required', '');
  }
});

//Solo letras en curso
    const cursoInput = document.getElementById('curso');

    cursoInput.addEventListener('input', () => {
    cursoInput.value = cursoInput.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
    });