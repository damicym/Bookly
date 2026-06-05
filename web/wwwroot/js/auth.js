// ===== AUTH: toggle mostrar/ocultar contraseña =====

function togglePassword(inputId, btn) {
    const input = document.getElementById(inputId)
    if (!input) return
    const isPassword = input.type === 'password'
    input.type = isPassword ? 'text' : 'password'
    btn.querySelector('.ojo-off').style.display = isPassword ? 'none' : ''
    btn.querySelector('.ojo-on').style.display = isPassword ? '' : 'none'
}
