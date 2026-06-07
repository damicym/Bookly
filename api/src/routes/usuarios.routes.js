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

// POST /api/usuarios/:dni/foto
router.post('/:dni/foto', upload.single('fotoPerfil'), usuariosCtrl.updateFotoPerfil)

export default router
