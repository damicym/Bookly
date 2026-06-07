import * as usuariosService from '../services/usuarios.service.js'

export async function loginUser(req, res) {
  try {
    const { dni, password } = req.body
    if (!dni || !password) {
      return res.status(400).json({ error: 'DNI y password son requeridos' })
    }
    const user = await usuariosService.login(dni, password)
    if (!user) {
      return res.status(401).json({ error: 'Credenciales inválidas' })
    }
    res.json({ success: true, user })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function registerUser(req, res) {
  try {
    const { dni, nombre_comp, ano, especialidad, curso, password } = req.body
    if (!dni || !password || !nombre_comp) {
      return res.status(400).json({ error: 'Datos incompletos' })
    }
    await usuariosService.register({ dni, nombre_comp, ano, especialidad, curso, password })
    res.status(201).json({ success: true, message: 'Usuario registrado' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function getUserInfo(req, res) {
  try {
    const { dni } = req.params
    const user = await usuariosService.getUserByDni(dni)
    if (!user) {
      return res.status(404).json({ error: 'Usuario no encontrado' })
    }
    res.json(user)
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function updateAbout(req, res) {
  try {
    const { dni } = req.params
    const { about_me } = req.body
    await usuariosService.updateAboutMe(dni, about_me ?? '')
    res.json({ success: true, message: 'Perfil actualizado' })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}

export async function updateFotoPerfil(req, res) {
  try {
    const { dni } = req.params
    if (!req.file) return res.status(400).json({ error: 'Archivo requerido' })
    const url = await usuariosService.subirFotoPerfil(dni, req.file.buffer, req.file.mimetype)
    res.json({ success: true, url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
}
