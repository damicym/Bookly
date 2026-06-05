import { Router } from 'express'
import * as usuariosCtrl from '../controllers/usuarios.controller.js'

const router = Router()

// POST /api/usuarios/login
router.post('/login', usuariosCtrl.loginUser)

// POST /api/usuarios/register
router.post('/register', usuariosCtrl.registerUser)

// GET /api/usuarios/:dni
router.get('/:dni', usuariosCtrl.getUserInfo)

// PUT /api/usuarios/:dni/about
router.put('/:dni/about', usuariosCtrl.updateAbout)

export default router
