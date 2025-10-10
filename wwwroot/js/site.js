//Especialidad deshabilitado
  const anoSelect = document.getElementById('ano');
  const especialidadSelect = document.getElementById('especialidad');

  anoSelect.addEventListener('change', () => {
    const valor = parseInt(anoSelect.value);
    especialidadSelect.disabled = isNaN(valor) || valor < 3;
  });
//Solo letras en curso
    const cursoInput = document.getElementById('curso');

    cursoInput.addEventListener('input', () => {
    cursoInput.value = cursoInput.value.replace(/[^a-zA-Z]/g, '').toUpperCase();
    });