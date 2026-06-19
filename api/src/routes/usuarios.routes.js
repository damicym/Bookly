import { Router } from 'express'
import multer from 'multer'
import * as usuariosCtrl from '../controllers/usuarios.controller.js'

const router = Router()
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } })

// POST /api/usuarios/login
router.post('/login', usuariosCtrl.loginUser)

// POST /api/usuarios/register
router.post('/register', usuariosCtrl.registerUser)

// GET /api/usuarios/:dni
router.get('/:dni', usuariosCtrl.getUserInfo)

// PUT /api/usuarios/:dni/about
router.put('/:dni/about', usuariosCtrl.updateAbout)

// PUT /api/usuarios/:dni/foto
// El backend .NET envía el campo como "imagen" en el multipart, mantengo coherencia.
router.put('/:dni/foto', upload.single('imagen'), usuariosCtrl.updateFotoPerfil)

// DELETE /api/usuarios/:dni/foto
router.delete('/:dni/foto', usuariosCtrl.deleteFotoPerfil)

export default router
